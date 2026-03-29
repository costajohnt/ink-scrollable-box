# Multi-pane — Tab between panes with independent scrolling
Output media/multi-pane.gif
Set Shell "bash"
Set Width 90
Set Height 24
Set FontSize 14
Set Theme "Dracula"
Set Padding 10

Type "npx tsx examples/multi-pane.tsx"
Enter
Sleep 1.5s

# Scroll Panel A
Type "j"
Sleep 200ms
Type "j"
Sleep 200ms
Type "j"
Sleep 200ms
Type "j"
Sleep 200ms
Type "j"
Sleep 500ms

# Tab to Panel B
Tab
Sleep 500ms

# Scroll Panel B
Type "j"
Sleep 200ms
Type "j"
Sleep 200ms
Type "j"
Sleep 200ms

# Jump Panel B to bottom
Type "G"
Sleep 800ms

# Tab back to Panel A — still at its previous position
Tab
Sleep 1s

# Exit
Ctrl+C
Sleep 500ms
