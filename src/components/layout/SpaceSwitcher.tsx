"use client";

export function SpaceSwitcher({
  spaces,
  currentSpaceId,
}: {
  spaces: { id: string; name: string; type: string }[];
  currentSpaceId?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Space</span>
      <select
        name="space"
        defaultValue={currentSpaceId}
        className="min-h-11 max-w-[200px] rounded-gm border border-paper-rule bg-paper-raised px-2"
        onChange={(event) => {
          const url = new URL(window.location.href);
          url.searchParams.set("space", event.target.value);
          window.location.href = url.toString();
        }}
      >
        {spaces.map((space) => (
          <option key={space.id} value={space.id}>
            {space.type === "personal" ? "Private · " : "Shared · "}
            {space.name}
          </option>
        ))}
      </select>
    </label>
  );
}
