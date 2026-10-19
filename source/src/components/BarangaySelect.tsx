import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BARANGAYS } from "@/lib/bulan";

export function BarangaySelect({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label="Barangay">
        <SelectValue placeholder="Choose your barangay" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {BARANGAYS.map((b) => (
          <SelectItem key={b.psgc} value={b.name}>{b.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
