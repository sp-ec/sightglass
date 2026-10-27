// ECharts draws to canvas, so slider colors are resolved per theme here instead of via CSS variables
const SLIDER_COLORS = {
	light: {
		background: "rgba(15, 23, 42, 0.04)",
		border: "rgba(15, 23, 42, 0.12)",
		filler: "rgba(14, 165, 233, 0.15)",
		handle: "#0ea5e9",
		handleBorder: "#ffffff",
		text: "#475569",
	},
	dark: {
		background: "rgba(255, 255, 255, 0.04)",
		border: "rgba(255, 255, 255, 0.12)",
		filler: "rgba(14, 165, 233, 0.2)",
		handle: "#38bdf8",
		handleBorder: "#b3d8ff",
		text: "#94a3b8",
	},
};

const buildSlider = (isDark: boolean) => {
	const colors = isDark ? SLIDER_COLORS.dark : SLIDER_COLORS.light;

	return {
		type: "slider",
		show: true,
		start: 0,
		end: 100,
		filterMode: "none",
		backgroundColor: colors.background,
		fillerColor: colors.filler,
		borderColor: colors.border,
		textStyle: { color: colors.text },
		handleStyle: {
			color: colors.handle,
			borderColor: colors.handleBorder,
			borderWidth: 1,
		},
		moveHandleStyle: { color: colors.handle },
		emphasis: {
			handleStyle: { borderColor: colors.handle },
			moveHandleStyle: { color: colors.handle },
		},
	};
};

// X and Y sliders plus scroll/drag zoom inside the plot area
export const buildDataZoom = (isDark: boolean) => [
	{ ...buildSlider(isDark), xAxisIndex: [0], bottom: 10 },
	{ ...buildSlider(isDark), yAxisIndex: [0], right: 10 },
	{ type: "inside", xAxisIndex: [0], filterMode: "none" },
	{ type: "inside", yAxisIndex: [0], filterMode: "none" },
];
