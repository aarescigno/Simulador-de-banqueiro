export function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2>{title}</h2>
      <p class="dim">{text}</p>
    </div>
  );
}
