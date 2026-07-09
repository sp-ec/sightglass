import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { AxisOption } from "@/components/charts/chart-types";


interface Props {
    axisOptions: readonly AxisOption[];
    xAxisLabel: string;
    selectedYAxisLabel: string;
    xAxisDisabled: boolean;
    onXAxisChange: (val: any) => void;
    onYAxisChange: (val: any) => void;
}

export function ChartAxisControls({
    axisOptions,
    xAxisLabel,
    selectedYAxisLabel,
    xAxisDisabled,
    onXAxisChange,
    onYAxisChange,
}: Props) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <p className="text-sm font-medium">X Axis</p>
                <Combobox items={axisOptions}>
                    <ComboboxInput
                        placeholder="Choose x axis"
                        value={xAxisLabel}
                        disabled={xAxisDisabled}
                    />
                    <ComboboxContent>
                        <ComboboxEmpty>No axis options found.</ComboboxEmpty>
                        <ComboboxList>
                            {axisOptions.map((option) => (
                                <ComboboxItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => onXAxisChange(option.value)}
                                    onClick={() => onXAxisChange(option.value)}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        onXAxisChange(option.value);
                                    }}
                                >
                                    {option.label}
                                </ComboboxItem>
                            ))}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">Y Axis</p>
                <Combobox items={axisOptions}>
                    <ComboboxInput placeholder="Choose y axis" value={selectedYAxisLabel} />
                    <ComboboxContent>
                        <ComboboxEmpty>No axis options found.</ComboboxEmpty>
                        <ComboboxList>
                            {axisOptions.map((option) => (
                                <ComboboxItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => onYAxisChange(option.value)}
                                    onClick={() => onYAxisChange(option.value)}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        onYAxisChange(option.value);
                                    }}
                                >
                                    {option.label}
                                </ComboboxItem>
                            ))}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </div>
        </div>
    );
}