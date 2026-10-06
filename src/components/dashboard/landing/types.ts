import type { LandingEditorData } from "@/lib/services/landing-editor-data";

/** Props comuns das abas do editor. `target` é o id da empresa quando um admin edita; ausente = a própria empresa. */
export type TabProps = {
  data: LandingEditorData;
  target?: string;
};
