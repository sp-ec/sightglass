import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GameLanguagesProps = {
  languageData: any;
};

function GameLanguages({ languageData }: GameLanguagesProps) {
  return (
    <Card className="w-full max-w-xl max-h-62 min-h-72">
					<CardHeader>
						<CardTitle>Supported Languages</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-row justify-between gap-4 overflow-y-scroll">
						{languageData && (
							<table className="w-full">
								<thead>
									<tr className="border-b text-left">
										<th className="py-2 pr-4">Language</th>
										<th className="py-2 pr-4">Code</th>
										<th className="py-2 pr-4">Supported</th>
										<th className="py-2 pr-4">Full Audio</th>
										<th className="py-2 pr-4">Subtitles</th>
									</tr>
								</thead>
								<tbody>
									{languageData.map((language: any) => (
										<tr key={language.code ?? language.name} className="border-b last:border-b-0">
											<td className="py-2 pr-4">{language.name}</td>
											<td className="py-2 pr-4">{language.code}</td>
											<td className="py-2 px-6">{language.supported ? '✓' : ''}</td>
											<td className="py-2 px-6">{language.full_audio ? '✓' : ''}</td>
											<td className="py-2 px-6">{language.subtitles ? '✓' : ''}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</CardContent>
				</Card>
  )
}

export default GameLanguages