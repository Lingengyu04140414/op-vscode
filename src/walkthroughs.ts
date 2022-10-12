import { commands } from "vscode";
import { INTERNAL_COMMANDS } from "./constants";
import { Core } from "./core";
import { GitHubActions } from "./walkthroughs/github-actions";

export class Walkthroughs {
	walkthroughs: { githubActions: GitHubActions };

	public constructor(private core: Core) {
		this.walkthroughs = {
			githubActions: new GitHubActions(),
		};

		this.core.context.subscriptions.push(
			commands.registerCommand(
				INTERNAL_COMMANDS.CONFIGURE_GITHUB_WORKFLOW_CONNECT,
				async () =>
					await this.walkthroughs.githubActions.configureWorkflow("connect"),
			),
			commands.registerCommand(
				INTERNAL_COMMANDS.CONFIGURE_GITHUB_WORKFLOW_SERVICE_ACCOUNTS,
				async () =>
					await this.walkthroughs.githubActions.configureWorkflow(
						"service-accounts",
					),
			),
		);
	}
}
