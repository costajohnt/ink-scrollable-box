# Log follower — auto-scroll with pause on manual scroll
Output media/log-follower.gif
Set Shell "bash"
Set Width 80
Set Height 24
Set FontSize 14
Set Theme "Dracula"
Set Padding 10

Type "npx tsx examples/log-follower.tsx"
Enter

# Watch auto-scroll for a few seconds
Sleep 4s

# Scroll up to pause auto-scroll
Type "k"
Sleep 300ms
Type "k"
Sleep 300ms
Type "k"
Sleep 300ms

# Watch new entries arrive without following
Sleep 3s

# Jump back to bottom — resume auto-scroll
Type "G"
Sleep 3s

# Exit
Ctrl+C
Sleep 500ms
