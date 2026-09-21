export type tagResolution = "average" | "minimum" | "maximum";

export type appSettingsSection = "access" | "api" | "estimation";

export type tagOption = { id: number; name: string };

export type accessSettings = { registrationEnabled: boolean };

// The key is write-only, so a read only ever reports that one is stored
export type apiSettingsView = { hasKey: boolean; maskedKey: string };

export type reviewMultiplierSettings = {
	baseline: number;
	min: number;
	max: number;
};

export type audienceSettings = { divisor: number; exponent: number };

export type realizedPriceSettings = {
	minMultiplier: number;
	startingMultiplier: number;
	perYearMultiplier: number;
	refundRateMin: number;
	refundRateMultiplier: number;
};

export type tagMultiplier = { tagId: number; tagName: string; mult: number };

export type priceMultiplier = {
	id: number;
	priceInCents: number;
	multiplier: number;
	above: boolean;
};

export type uncertaintyBand = {
	id: number;
	reviewCount: number;
	low: number;
	high: number;
	above: boolean;
};

export type estimationSettings = {
	reviewMultiplier: reviewMultiplierSettings;
	audience: audienceSettings;
	tagResolution: tagResolution;
	realizedPrice: realizedPriceSettings;
	tagMultipliers: tagMultiplier[];
	priceMultipliers: priceMultiplier[];
	uncertaintyBands: uncertaintyBand[];
};

export type appSettingsView = {
	access: accessSettings;
	api: apiSettingsView;
	estimation: estimationSettings;
};

// uiKey is a stable React key for rows the admin has not saved yet; it is
// stripped before the payload is sent
export type tagMultiplierRow = { uiKey: string; tagId: number; mult: number };

export type priceMultiplierRow = {
	uiKey: string;
	priceInCents: number;
	multiplier: number;
	above: boolean;
};

export type uncertaintyBandRow = {
	uiKey: string;
	reviewCount: number;
	low: number;
	high: number;
	above: boolean;
};

// What the estimation tab edits: the server shape with ui keys on the lists
export type estimationForm = {
	reviewMultiplier: reviewMultiplierSettings;
	audience: audienceSettings;
	tagResolution: tagResolution;
	realizedPrice: realizedPriceSettings;
	tagMultipliers: tagMultiplierRow[];
	priceMultipliers: priceMultiplierRow[];
	uncertaintyBands: uncertaintyBandRow[];
};

// The API tab never mirrors server state, so its form is just the new key
export type apiForm = { steamApiKey: string };
