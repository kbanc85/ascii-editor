import { EditorProvider } from "@/lib/editor-context";
import Editor from "@/components/Editor";

export default function Home() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  );
}
