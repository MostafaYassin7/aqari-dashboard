export function useExportCsv() {
  return (
    filename: string,
    headers: string[],
    rows: (string | number | null | undefined)[][]
  ) => {
    const escape = (v: string | number | null | undefined) =>
      `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(escape), ...rows.map((r) => r.map(escape))]
      .map((r) => r.join(","))
      .join("\n");
    // UTF-8 BOM so Excel opens Arabic text correctly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
}
