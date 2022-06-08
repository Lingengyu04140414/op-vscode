import { createDocument, firstValue, sample } from "../../../test/utils";
import { getPatternSuggestion } from "../patterns";
import { BRANDS } from "../suggestion";
import testData from "./../pattern-test-data.json";
import DotEnvParser, { DOTENV_LINE } from "./dotenv";

describe("DOTENV_LINE", () => {
	// This regex is from dotenv, which has thoroughly tested it:
	// https://github.com/motdotla/dotenv/tree/master/tests
	it("matches a line of a .env file", () => {
		const line = "VAR=value";
		expect(line).toHaveRegExpParts(DOTENV_LINE, "VAR", "value");
	});
});

describe("DotEnvParser", () => {
	it("gets suggestions from known value patterns", () => {
		const data = Array.from({ length: 5 }).map(() => {
			const [id, value] = sample(testData);
			const suggestion = getPatternSuggestion(id);
			const line = `${firstValue(suggestion.item)}=${value}`;
			return { line, value, suggestion };
		});

		const parser = new DotEnvParser(
			createDocument(data.map(({ line }) => line)),
		);

		for (const match of parser.getMatches()) {
			const { suggestion, value } = data.find(
				(d) => d.value === match.fieldValue,
			);

			expect(match).toEqual({
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				range: expect.any(Object),
				fieldValue: value,
				suggestion,
			});
		}
	});

	it("gets suggestions from known field pattern, implied brand name", () => {
		const suggestion = getPatternSuggestion("ccard");
		const brand = sample(BRANDS);
		const value = "4012888888881881";

		suggestion.item = brand;

		const parser = new DotEnvParser(createDocument([`${brand}=${value}`]));

		expect(parser.getMatches()).toEqual([
			{
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				range: expect.any(Object),
				fieldValue: value,
				suggestion,
			},
		]);
	});
});
