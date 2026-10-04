import { copyText } from "../lib/copy-command";

for (const root of document.querySelectorAll<HTMLElement>("[data-copy-root]")) {
  const code = root.querySelector<HTMLElement>("[data-command]")!;
  const button = root.querySelector<HTMLButtonElement>("[data-copy-button]")!;
  const status = root.querySelector<HTMLElement>("[data-copy-status]")!;
  let timer: number | undefined;
  button.hidden = false;
  button.addEventListener("click", async () => {
    window.clearTimeout(timer);
    const ok = await copyText(code.textContent ?? "", navigator.clipboard);
    if (ok) {
      status.textContent = "コピーしました";
      timer = window.setTimeout(() => { status.textContent = ""; }, 2000);
    } else {
      status.textContent = "コピーできませんでした。コマンドを選択してコピーしてください";
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  });
}
