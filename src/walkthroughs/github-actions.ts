import {
	Position,
	Uri,
	ViewColumn,
	window,
	workspace,
	WorkspaceEdit,
} from "vscode";
import { dump, load, YAMLNode } from "yaml-ast-parser";

type SetupType = "connect" | "service-accounts";

const WORKFLOW_BASE_CONFIGS = {
	connect: `on: push

jobs:
  hello-world:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Configure 1Password Connect
        uses: 1password/load-secrets-action/configure@v1
        with:
          connect-host: \${{ secrets.OP_CONNECT_HOST }}
          connect-token: \${{ secrets.OP_CONNECT_TOKEN }}`,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	"service-accounts": `on: push

jobs:
  hello-world:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Configure 1Password Service Account
        uses: 1password/load-secrets-action/configure@v1
        with:
          service-account-token: \${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}`,
};

export class GitHubActions {
	workflowData: YAMLNode;

	public async configureWorkflow(type: SetupType) {
		const files = await workspace.findFiles(".github/workflows/*.{yml,yaml}");

		const newWorkflowLabel = "Create new GitHub workflow";
		let fileOrNew: string = newWorkflowLabel;

		if (files.length > 0) {
			fileOrNew = await window.showQuickPick(
				[
					...files.map((file) => file.path.slice(file.path.indexOf(".github"))),
					newWorkflowLabel,
				],
				{
					title: "Choose an existing workflow, or create a new one",
					ignoreFocusOut: true,
				},
			);

			if (!fileOrNew) {
				return;
			}
		}

		await (fileOrNew === newWorkflowLabel
			? this.createNewWorkflow(type)
			: this.updateExistingWorkflow(
					files.find((file) => file.path.endsWith(fileOrNew)),
					type,
			  ));
	}

	private async createNewWorkflow(type: SetupType) {
		const wsedit = new WorkspaceEdit();
		const wsPath = workspace.workspaceFolders[0].uri.fsPath;
		const filePath = Uri.file(
			`${wsPath}/.github/workflows/example-${type}.yml`,
		);

		const content = WORKFLOW_BASE_CONFIGS[type];
		this.workflowData = load(content);

		wsedit.createFile(filePath, { ignoreIfExists: true });
		wsedit.insert(filePath, new Position(0, 0), WORKFLOW_BASE_CONFIGS[type]);
		await workspace.applyEdit(wsedit);

		const file = await workspace.openTextDocument(filePath);
		await file.save();

		void (await window.showTextDocument(filePath, {
			viewColumn: ViewColumn.Beside,
		}));
	}

	private async updateExistingWorkflow(uri: Uri, type: SetupType) {
		const file = await workspace.openTextDocument(uri);
		this.workflowData = load(file.getText());

		void (await window.showTextDocument(file.uri, {
			viewColumn: ViewColumn.Beside,
		}));

		console.log(dump(this.workflowData, {}));
	}
}
