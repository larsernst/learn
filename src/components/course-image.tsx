// Kursbild-Anzeige: dezent im Atlassian-Stil (Hairline-Rahmen, feste Höhe,
// Platzhalter ohne Bild). src ist die öffentliche Bild-Route des Kurses.
export function CourseImage({
  courseId,
  hasImage,
  title,
  height = 120,
}: {
  courseId: string;
  hasImage: boolean;
  title: string;
  height?: number;
}) {
  if (!hasImage) {
    return (
      <div
        aria-hidden
        style={{
          height,
          borderRadius: "var(--ds-radius) var(--ds-radius) 0 0",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--ds-brand) 14%, transparent), color-mix(in srgb, var(--ds-brand) 4%, transparent))",
          borderBottom: "1px solid var(--ds-border)",
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/courses/${courseId}/image`}
      alt={`Kursbild: ${title}`}
      style={{
        width: "100%",
        height,
        objectFit: "cover",
        display: "block",
        borderRadius: "var(--ds-radius) var(--ds-radius) 0 0",
        borderBottom: "1px solid var(--ds-border)",
      }}
    />
  );
}
