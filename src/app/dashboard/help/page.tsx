"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { AxiosError } from "axios";
import {
  LifeBuoy,
  Plus,
  X,
  Search,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  ArrowLeft,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

type Category = {
  id: string;
  name: string;
  description: string;
  slug: string;
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  categoryId: string;
  category?: Category;
  productKey?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  organization?: {
    name: string;
  };
  messages?: Message[];
};

type Message = {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

// ============================================================
// API ERROR TYPE
// ============================================================

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// ============================================================
// HELPER: Get error message from unknown error
// ============================================================

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse;
    return data?.message || data?.error || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

// ============================================================
// COMPONENTS - Memoized
// ============================================================

const StatusBadge = React.memo(function StatusBadge({ status }: { status: Ticket["status"] }) {
  const config = {
    OPEN: { label: "Open", icon: AlertCircle, className: styles.statusOpen },
    IN_PROGRESS: { label: "In Progress", icon: Clock, className: styles.statusInProgress },
    RESOLVED: { label: "Resolved", icon: CheckCircle2, className: styles.statusResolved },
    CLOSED: { label: "Closed", icon: CheckCircle2, className: styles.statusClosed },
  };
  const { label, icon: Icon, className } = config[status];
  return (
    <span className={`${styles.badge} ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
});

const PriorityBadge = React.memo(function PriorityBadge({ priority }: { priority: Ticket["priority"] }) {
  const config = {
    LOW: { label: "Low", className: styles.priorityLow },
    MEDIUM: { label: "Medium", className: styles.priorityMedium },
    HIGH: { label: "High", className: styles.priorityHigh },
    URGENT: { label: "Urgent", className: styles.priorityUrgent },
  };
  const { label, className } = config[priority];
  return <span className={`${styles.priorityBadge} ${className}`}>{label}</span>;
});

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${type === "success" ? styles.toastSuccess : styles.toastError}`}>
      <span>{message}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function HelpPage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // View states
  const [view, setView] = useState<"list" | "detail" | "new">("list");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    priority: "MEDIUM" as Ticket["priority"],
    productKey: "",
  });
  const [messageInput, setMessageInput] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Ticket["status"]>("ALL");

  // ============================================================
  // REFS
  // ============================================================

  const isMounted = useRef(true);
  const hasFetched = useRef(false);

  // ============================================================
  // FETCH DATA - Memoized
  // ============================================================

  const fetchData = useCallback(async () => {
    if (!activeOrganization || !isMounted.current) return;

    setLoading(true);
    try {
      const orgId = activeOrganization.id;

      const [categoriesRes, ticketsRes] = await Promise.all([
        api.get(`/api/v1/organizations/${orgId}/support/categories`),
        api.get(`/api/v1/organizations/${orgId}/support/tickets`),
      ]);

      if (!isMounted.current) return;

      setCategories(categoriesRes.data.categories || []);
      setTickets(ticketsRes.data.items || []);
    } catch (error: unknown) {
      if (isMounted.current) {
        console.error("Failed to fetch support data:", error);
        setToast({ type: "error", message: "Failed to load support data" });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [activeOrganization]);

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    isMounted.current = true;
    hasFetched.current = false;

    const loadData = async () => {
      if (hasFetched.current || !isMounted.current) return;
      hasFetched.current = true;
      await fetchData();
    };

    loadData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  // ============================================================
  // HANDLERS - Memoized
  // ============================================================

  const handleCreateTicket = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;

    setSubmitting(true);
    try {
      const orgId = activeOrganization.id;
      const res = await api.post(`/api/v1/organizations/${orgId}/support/tickets`, formData);
      
      if (!isMounted.current) return;
      
      setToast({ type: "success", message: "Ticket created successfully" });
      setView("list");
      setFormData({ title: "", description: "", categoryId: "", priority: "MEDIUM", productKey: "" });
      await fetchData();
      
      if (res.data.ticket && isMounted.current) {
        setSelectedTicket(res.data.ticket);
        setView("detail");
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        const message = getErrorMessage(error, "Failed to create ticket");
        setToast({ type: "error", message });
      }
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  }, [activeOrganization, formData, fetchData]);

  const handleAddMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization || !selectedTicket || !messageInput.trim()) return;

    setSubmitting(true);
    try {
      const orgId = activeOrganization.id;
      await api.post(
        `/api/v1/organizations/${orgId}/support/tickets/${selectedTicket.id}/messages`,
        { message: messageInput }
      );
      
      if (!isMounted.current) return;
      
      setMessageInput("");
      const res = await api.get(`/api/v1/organizations/${orgId}/support/tickets/${selectedTicket.id}`);
      if (isMounted.current) {
        setSelectedTicket(res.data.ticket);
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        const message = getErrorMessage(error, "Failed to send message");
        setToast({ type: "error", message });
      }
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  }, [activeOrganization, selectedTicket, messageInput]);

  const handleUpdateTicketStatus = useCallback(async (status: Ticket["status"]) => {
    if (!activeOrganization || !selectedTicket) return;

    try {
      const orgId = activeOrganization.id;
      await api.patch(`/api/v1/organizations/${orgId}/support/tickets/${selectedTicket.id}`, { status });
      
      if (!isMounted.current) return;
      
      setToast({ type: "success", message: "Ticket status updated" });
      const res = await api.get(`/api/v1/organizations/${orgId}/support/tickets/${selectedTicket.id}`);
      if (isMounted.current) {
        setSelectedTicket(res.data.ticket);
        await fetchData();
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        const message = getErrorMessage(error, "Failed to update status");
        setToast({ type: "error", message });
      }
    }
  }, [activeOrganization, selectedTicket, fetchData]);

  const openTicketDetail = useCallback(async (ticketId: string) => {
    if (!activeOrganization) return;
    try {
      const orgId = activeOrganization.id;
      const res = await api.get(`/api/v1/organizations/${orgId}/support/tickets/${ticketId}`);
      if (isMounted.current) {
        setSelectedTicket(res.data.ticket);
        setView("detail");
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        const message = getErrorMessage(error, "Failed to load ticket details");
        setToast({ type: "error", message });
      }
    }
  }, [activeOrganization]);

  const handleFormChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // ============================================================
  // MEMOIZED COMPUTATIONS
  // ============================================================

  const filteredTickets = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch = ticket.title.toLowerCase().includes(search) ||
                            ticket.description.toLowerCase().includes(search);
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length,
  }), [tickets]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading support...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ===== TICKET LIST VIEW ===== */}
      {view === "list" && (
        <>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <LifeBuoy size={20} className={styles.headerIcon} />
              <div>
                <h1 className={styles.headerTitle}>Help & Support</h1>
                <p className={styles.headerSubtitle}>Get help with your KXBYTE products</p>
              </div>
            </div>
            <button
              className={styles.primaryButton}
              onClick={() => setView("new")}
            >
              <Plus size={16} />
              New Ticket
            </button>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total Tickets</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.open}</div>
              <div className={styles.statLabel}>Open</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.inProgress}</div>
              <div className={styles.statLabel}>In Progress</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.resolved}</div>
              <div className={styles.statLabel}>Resolved</div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filtersBar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Ticket List */}
          <div className={styles.ticketList}>
            {filteredTickets.length === 0 ? (
              <div className={styles.emptyState}>
                <LifeBuoy size={48} className={styles.emptyIcon} />
                <h3>No tickets found</h3>
                <p>Create a ticket to get help with your products</p>
                <button
                  className={styles.primaryButton}
                  onClick={() => setView("new")}
                >
                  <Plus size={16} />
                  New Ticket
                </button>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  className={styles.ticketItem}
                  onClick={() => openTicketDetail(ticket.id)}
                >
                  <div className={styles.ticketItemLeft}>
                    <div className={styles.ticketItemTitle}>
                      <span className={styles.ticketItemName}>{ticket.title}</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className={styles.ticketItemMeta}>
                      <span className={styles.ticketItemCategory}>
                        {ticket.category?.name || "General"}
                      </span>
                      <span className={styles.ticketItemTime}>
                        {new Date(ticket.createdAt).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {ticket._count && (
                        <span className={styles.ticketItemMessages}>
                          <MessageSquare size={12} />
                          {ticket._count.messages}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.ticketItemRight}>
                    <PriorityBadge priority={ticket.priority} />
                    <ChevronRight size={16} className={styles.ticketItemArrow} />
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {/* ===== NEW TICKET VIEW ===== */}
      {view === "new" && (
        <div className={styles.detailView}>
          <div className={styles.detailHeader}>
            <button className={styles.backButton} onClick={() => setView("list")}>
              <ArrowLeft size={18} />
              Back
            </button>
            <h2 className={styles.detailTitle}>New Ticket</h2>
          </div>

          <form onSubmit={handleCreateTicket} className={styles.ticketForm}>
            <div className={styles.formGroup}>
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Brief summary of your issue"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleFormChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Product (optional)</label>
                <input
                  type="text"
                  name="productKey"
                  value={formData.productKey}
                  onChange={handleFormChange}
                  placeholder="e.g. kxtill, kxinvoice"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Describe your issue in detail"
                rows={5}
                required
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setView("list")}>
                Cancel
              </button>
              <button type="submit" className={styles.submitButton} disabled={submitting}>
                {submitting ? <Loader2 size={16} className={styles.spinning} /> : <Send size={16} />}
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== TICKET DETAIL VIEW ===== */}
      {view === "detail" && selectedTicket && (
        <div className={styles.detailView}>
          {/* Header */}
          <div className={styles.detailHeader}>
            <button className={styles.backButton} onClick={() => { setView("list"); setSelectedTicket(null); }}>
              <ArrowLeft size={18} />
              Back
            </button>
            <div className={styles.detailHeaderRight}>
              <span className={styles.detailId}>#{selectedTicket.id.slice(0, 8).toUpperCase()}</span>
              <StatusBadge status={selectedTicket.status} />
              <PriorityBadge priority={selectedTicket.priority} />
            </div>
          </div>

          {/* Ticket Info */}
          <div className={styles.detailInfo}>
            <h2 className={styles.detailTitle}>{selectedTicket.title}</h2>
            <p className={styles.detailDescription}>{selectedTicket.description}</p>
            <div className={styles.detailMeta}>
              <span>Category: {selectedTicket.category?.name || "General"}</span>
              {selectedTicket.productKey && <span>Product: {selectedTicket.productKey}</span>}
              <span>Created: {new Date(selectedTicket.createdAt).toLocaleString("en-KE")}</span>
            </div>
          </div>

          {/* Status Actions */}
          {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
            <div className={styles.statusActions}>
              <button
                className={styles.statusActionButton}
                onClick={() => handleUpdateTicketStatus("IN_PROGRESS")}
                disabled={selectedTicket.status === "IN_PROGRESS"}
              >
                Start Progress
              </button>
              <button
                className={styles.statusActionButtonResolve}
                onClick={() => handleUpdateTicketStatus("RESOLVED")}
              >
                Resolve
              </button>
              <button
                className={styles.statusActionButtonClose}
                onClick={() => handleUpdateTicketStatus("CLOSED")}
              >
                Close
              </button>
            </div>
          )}

          {/* Messages */}
          <div className={styles.messagesSection}>
            <h3 className={styles.messagesTitle}>Messages</h3>
            <div className={styles.messagesList}>
              {(selectedTicket.messages || []).length === 0 ? (
                <div className={styles.messagesEmpty}>No messages yet</div>
              ) : (
                (selectedTicket.messages || []).map((msg) => (
                  <div key={msg.id} className={styles.messageItem}>
                    <div className={styles.messageAvatar}>
                      {msg.user.firstName?.charAt(0) || "U"}
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.messageHeader}>
                        <span className={styles.messageUser}>
                          {msg.user.firstName} {msg.user.lastName}
                        </span>
                        <span className={styles.messageTime}>
                          {new Date(msg.createdAt).toLocaleString("en-KE")}
                        </span>
                      </div>
                      <div className={styles.messageText}>{msg.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Form */}
            {selectedTicket.status !== "CLOSED" && (
              <form onSubmit={handleAddMessage} className={styles.replyForm}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your reply..."
                  disabled={submitting}
                />
                <button type="submit" disabled={submitting || !messageInput.trim()}>
                  {submitting ? <Loader2 size={16} className={styles.spinning} /> : <Send size={16} />}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}