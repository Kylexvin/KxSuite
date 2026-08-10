type Props = {
  params: { slug: string };
};

export default function TestPage({ params }: Props) {
  return <div>Test slug: {params.slug}</div>;
}