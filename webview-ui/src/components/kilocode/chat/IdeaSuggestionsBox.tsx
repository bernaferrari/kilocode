import { useMemo } from "react"
import { telemetryClient } from "@/utils/TelemetryClient"
import { vscode } from "@/utils/vscode"
import { TelemetryEventName } from "@roo-code/types"
import { useTranslation } from "react-i18next"
import { useTaskHistory } from "@/kilocode/hooks/useTaskHistory"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { Lightbulb, ChevronRight } from "lucide-react"

export const IdeaSuggestionsBox = () => {
	const { t } = useTranslation("kilocode")
	const { taskHistoryVersion } = useExtensionState()

	// Check if current workspace has any tasks
	const { data } = useTaskHistory(
		{
			workspace: "current",
			sort: "newest",
			favoritesOnly: false,
			pageIndex: 0,
		},
		taskHistoryVersion,
	)
	const hasWorkspaceTasks = (data?.historyItems?.length ?? 0) > 0

	// Show 2 random ideas - memoized to prevent re-shuffling on re-renders
	// Must be called before early return to satisfy React hooks rules
	const shuffledIdeas = useMemo(
		() =>
			[...Object.values(t("ideaSuggestionsBox.ideas", { returnObjects: true }) as Record<string, string>)]
				.sort(() => Math.random() - 0.5)
				.slice(0, 2),
		[t],
	)

	// Don't show if workspace has tasks
	if (hasWorkspaceTasks) {
		return null
	}

	const handleIdeaClick = (idea: string) => {
		vscode.postMessage({
			type: "newTask",
			text: idea,
			images: [],
		})

		telemetryClient.capture(TelemetryEventName.SUGGESTION_BUTTON_CLICKED, {
			idea,
		})
	}

	const getItemRadius = (index: number, total: number) => {
		if (total === 1) return "rounded-xl"
		if (index === 0) return "rounded-t-xl rounded-b"
		if (index === total - 1) return "rounded-t rounded-b-xl"
		return "rounded"
	}

	return (
		<div className="flex flex-col items-center w-full">
			{/* kilocode_change start */}
			{/* Header */}
			<p className="text-xs text-vscode-descriptionForeground mb-3">{t("ideaSuggestionsBox.tryOneOfThese")}</p>

			{/* Stacked Suggestion Cards */}
			<div className="flex flex-col w-full gap-0.5">
				{shuffledIdeas.map((idea, index) => (
					<button
						key={index}
						onClick={() => handleIdeaClick(idea)}
						className={`group flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm 
							bg-vscode-input-background border border-vscode-input-border
							cursor-pointer transition-all duration-150
							hover:bg-vscode-list-hoverBackground hover:border-vscode-focusBorder hover:z-10
							${getItemRadius(index, shuffledIdeas.length)}`}>
						<div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-vscode-badge-background transition-colors">
							<Lightbulb className="w-3.5 h-3.5 text-vscode-badge-foreground" />
						</div>
						<span className="flex-1 text-vscode-foreground">{idea}</span>
						<ChevronRight className="w-4 h-4 text-vscode-descriptionForeground opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0.5" />
					</button>
				))}
			</div>
			{/* kilocode_change end */}
		</div>
	)
}
