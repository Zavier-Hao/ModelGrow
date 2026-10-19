/** AI 回复中的打字气泡：三颗跳动的小点 */
export default function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="frosted-glass px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent-blue-light"
            style={{ animation: `typingDot 1.2s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}
