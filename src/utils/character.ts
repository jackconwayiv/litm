import type { CharacterRow } from "../types/types";

export type CharacterBriefFields = Pick<
  CharacterRow,
  | "brief_trait_physical"
  | "brief_trait_personality"
  | "brief_race"
  | "brief_class"
>;

export type BriefOptions = {
  capitalizeTraits?: boolean; // default false
  titleCaseRaceClass?: boolean; // default true
  includeComma?: boolean; // between traits, default true
};

const clean = (s?: string) => (s ?? "").trim();

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");

export function buildCharacterBrief(
  src: Partial<CharacterBriefFields> | CharacterRow,
  opts: BriefOptions = {}
): string {
  const {
    capitalizeTraits = false,
    titleCaseRaceClass = true,
    includeComma = true,
  } = opts;

  let phys = clean(src.brief_trait_physical);
  let pers = clean(src.brief_trait_personality);
  let race = clean(src.brief_race);
  let cls = clean(src.brief_class);

  if (capitalizeTraits) {
    phys &&= titleCase(phys);
    pers &&= titleCase(pers);
  }
  if (titleCaseRaceClass) {
    race &&= titleCase(race);
    cls &&= titleCase(cls);
  }

  const left =
    phys || pers
      ? [phys, pers].filter(Boolean).join(includeComma ? ", " : " ")
      : "";
  const right = [race, cls].filter(Boolean).join(" ");

  return [left, right].filter(Boolean).join(left && right ? " " : "");
}
