"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
	src: string | null;
	alt: string;
	className?: string;
	// Rendered instead of the placeholder when the asset is decorative
	hideOnError?: boolean;
	sizes?: string;
	priority?: boolean;
}

// Steam ships a different subset of assets for every game, and some URLs are
// built from the app id without anything to check first, so a 404 is normal.
// Anything that fails collapses to a placeholder rather than a broken image.
export function AssetImage({
	src,
	alt,
	className,
	hideOnError,
	sizes = "(max-width: 768px) 100vw, 33vw",
	priority,
}: Props) {
	const [failed, setFailed] = React.useState(false);

	React.useEffect(() => {
		setFailed(false);
	}, [src]);

	const missing = !src || failed;

	if (missing && hideOnError) {
		return null;
	}

	if (missing) {
		return (
			<div
				className={cn(
					"flex items-center justify-center bg-muted text-muted-foreground",
					className,
				)}
			>
				<ImageOff className="size-5" />
			</div>
		);
	}

	return (
		<Image
			src={src}
			alt={alt}
			fill
			sizes={sizes}
			priority={priority}
			className={cn("object-cover", className)}
			onError={() => setFailed(true)}
		/>
	);
}
