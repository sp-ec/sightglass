import { useMemo } from "react";
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ChartFilterMode, FilterOption } from "@/components/charts/chart-types";

interface Props {
    label: string;
    placeholder: string;
    options: FilterOption[];
    selectedIds: number[];
    mode: ChartFilterMode;
    onSelectionChange: (ids: number[]) => void;
    onModeChange: (mode: ChartFilterMode) => void;
}

export function ChartFilterChipSelect({
    label,
    placeholder,
    options,
    selectedIds,
    mode,
    onSelectionChange,
    onModeChange,
}: Props) {
    const anchor = useComboboxAnchor();

    // Selected values must be the same object references held in options
    const selectedOptions = useMemo(
        () => options.filter((option) => selectedIds.includes(option.id)),
        [options, selectedIds],
    );

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">{label}</p>
            <Combobox
                items={options}
                multiple
                value={selectedOptions}
                onValueChange={(value: FilterOption[]) =>
                    onSelectionChange(value.map((option) => option.id))
                }
                itemToStringLabel={(option: FilterOption) => option.name}
            >
                <ComboboxChips ref={anchor}>
                    <ComboboxValue>
                        {(value: FilterOption[]) => (
                            <>
                                {value.map((option) => (
                                    <ComboboxChip key={option.id} aria-label={option.name}>
                                        {option.name}
                                    </ComboboxChip>
                                ))}
                                <ComboboxChipsInput
                                    placeholder={value.length ? "" : placeholder}
                                />
                            </>
                        )}
                    </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={anchor}>
                    <ComboboxEmpty>No matches found.</ComboboxEmpty>
                    <ComboboxList>
                        {(option: FilterOption) => (
                            <ComboboxItem key={option.id} value={option}>
                                {option.name}
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
            <ButtonGroup className="w-full">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={mode === "include"}
                    onClick={() => onModeChange("include")}
                >
                    Include
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={mode === "exclude"}
                    onClick={() => onModeChange("exclude")}
                >
                    Exclude
                </Button>
            </ButtonGroup>
        </div>
    );
}
