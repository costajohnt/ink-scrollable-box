# Hero demo — basic scrolling with keyboard navigation
Output media/hero.gif
Set Shell "bash"
Set Width 80
Set Height 24
Set FontSize 14
Set Theme "Dracula"
Set Padding 10

Type "npx tsx examples/basic.tsx"
Enter
Sleep 1.5s

# Scroll down with j
Type "j"
Sleep 300ms
Type "j"
Sleep 300ms
Type "j"
Sleep 300ms
Type "j"
Sleep 300ms
Type "j"
Sleep 500ms

# Jump to bottom with G
Type "G"
Sleep 1s

# Jump back to top with g
Type "g"
Sleep 1s

# Page down with d
Type "d"
Sleep 500ms
Type "d"
Sleep 500ms

# Page up with u
Type "u"
Sleep 1s

# Half-page with Ctrl+D
Ctrl+D
Sleep 500ms
Ctrl+D
Sleep 500ms

# Back to top
Type "g"
Sleep 1s

# Exit
Ctrl+C
Sleep 500ms
