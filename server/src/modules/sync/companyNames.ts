// Steam lists a company exactly as each store page spells it, so "KRAFTON, Inc"
// and "KRAFTON, Inc." or "Aspyr (Mac)" and "Aspyr" arrive as different names.
// Developers and publishers are matched on companyNameKey instead of the raw name.

const PLATFORM = "(?:mac|linux|windows|pc|macos|osx|mac os x|steamos)";
const PLATFORM_TAG = new RegExp(
	`\\s*\\(${PLATFORM}(?:\\s*[,/&]\\s*${PLATFORM})*\\)$`,
	"i",
);

const TRAILING_PUNCTUATION = /[\s.,]+$/;

// Matched against an already lowercased name
const LEGAL_SUFFIX =
	/[\s,]+(?:inc|llc|l\.l\.c|ltd|limited|corp|corporation|co|gmbh|s\.?a\.?s?|s\.?r\.?l|ab|pty|plc|oy|k\.?k|ag|bv|b\.v)$/;

// Stacked suffixes such as "Co., Ltd." need more than one pass
const LEGAL_SUFFIX_PASSES = 3;

// The name as stored and displayed. Only ever shortens the name, so it still
// fits the VARCHAR(255) column.
export const cleanCompanyName = (name: string): string =>
	name.replace(/\s+/g, " ").trim().replace(PLATFORM_TAG, "");

// Empty for names with no letters or digits to match on, such as "...".
// NFKC folds full-width and compatibility characters into their plain forms.
export const companyNameKey = (name: string): string => {
	let key = cleanCompanyName(name.normalize("NFKC"))
		.toLowerCase()
		.replace(TRAILING_PUNCTUATION, "");

	for (let i = 0; i < LEGAL_SUFFIX_PASSES; i++) {
		key = key.replace(LEGAL_SUFFIX, "").replace(TRAILING_PUNCTUATION, "");
	}

	return key;
};
