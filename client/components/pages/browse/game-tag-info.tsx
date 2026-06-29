import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GameTagInfoProps = {
  tagData: any;
};

function GameTagInfo({ tagData }: GameTagInfoProps) {
  return (
    <Card className="w-full max-w-xl max-h-62 min-h-62 ">
					<CardHeader>
						<CardTitle>Tags</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-row justify-between gap-4 overflow-y-scroll">
						{tagData && (
							<div className="flex flex-wrap gap-2">
								{tagData.map((tag: any) => (
									<span
										key={tag.id}
										className="border-sky-500 border text-white px-2 py-1 rounded-md"
									>
										{tag.name}
										<span className="opacity-50">
											{tag.weight > 1 ? ` (${tag.weight})` : ""}
										</span>
									</span>
								))}
							</div>
						)}
					</CardContent>
				</Card>
  )
}

export default GameTagInfo