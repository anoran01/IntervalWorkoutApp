Interval Workout App Design Document
1. Goal: A simple interval workout app I can publish and download on the iOS App Store.
2. Detailed Features: 
    2.1 Two Main Menus: Quick Create and Workout List. Multiple sub-menus accessed from those two main menus. The app opens in the Quick Create menu.
    2.2 Quick Create Menu
        2.2.1 6 types of time periods to create: Prepare, Work, Rest, Rounds, Cycles, Rest between Cycles. Each type can be clicked on to adjust time. Rounds consist of 1 Work period and 1 Rest period. Cycles consist of the Number of rounds specified.
        2.2.2 A Create button at the bottom (2/3rds of the way down the screen)
        2.2.3 Two big buttons in a bottom bar: Quick Create (selected by default when opening the app) and Workout List. Since this is the Quick Create menu that button appears to be selected. This is visually shown by a slight color change relative to the Workout List button and the background (which should have the same fill color).
        2.2.4 A settings button in the top right that accesses global settings that apply to the entire app or to every workout created in Quick Create.
    2.3: Time Periods Menus (Prepare, Work, Rest, Rest between Cycles)
        2.3.1 Each time period can be specified with in hours, minutes, and seconds with a rolodex style widget for each. The widgets are all aligned in a horizontal row. The rolodex extends down the screen vertically for each of the hours, minutes, and seconds options.
        2.3.2 A confirm button at the bottom
    2.4 Settings Menu (Quick Create)
        2.4.1 A mode button that switches between Dark (default) and Light.
        2.4.2 A setting called "Beep Tone" that allows you to customize the tone of the beeping that plays towards the end of a period.
        2.4.3 A setting called "Beep Start" that specifies how many seconds remaining in a period do the beeps start playing to signify the end of the period.
        2.4.4 A setting called "halfway reminder" that can be checked (default) or unchecked. It causes a voice to say "halfway" in the middle of a period.
        2.4.5 A setting called "10 second reminder" that can be checked (default) or unchecked. It causes a voice to say "10 seconds" at the 10 second remaining point in a period.
        2.4.6 A setting called "verbal reminder" that can be checked (default) or unchecked. It causes a voice to say "Work" or "Rest" at the start of a period depending on what period type it is.
        2.4.7 A done button at the bottom of the screen.
    2.5 Beep Tone Menu
        2.5.1 A widget to control beep tone.
        2.5.2 A done button at the bottom of the screen.
    2.6 Beep Start Menu
        2.6.1 A rolodex widget to set the beep start in seconds.
        2.6.2 A done button at the bottom of the screen.
    2.7 Rounds/Cycles Menu
        2.7.1 A rolodex style widget to select the number of rounds or cycles
        2.7.2 A confirm button at the bottom of the screen.
    2.8 Workout List Menu
        2.8.1 A vertical list of created workouts. A workout created in the Quick Create menu will appear here. It will be named sequentially starting with "Workout 1" using the first available number. Newly created workouts are added to the bottom of the list.
        2.8.2 A settings button in the top right enters a settings menu that contains global settings.
        2.8.3 Each workout can be clicked on to access.
        2.8.4 Each workout can be tapped and held for a period of time, then dragged to move it up or down the list of workouts.
        2.8.5 Just like the Quick Create menu, there are two buttons at the bottom for "Quick Create" and "Workout List". Since this is the Workout List menu that button appears to be selected. This is visually shown by a slight color change relative to the Quick Create button and the background (which should have the same fill color).
    2.9 Settings Menu (Workout List)
        2.9.1 A mode button that switches between Dark (default) and Light.
        2.9.2 A done button at the bottom of the screen.
    2.10 Workout Menu
        2.10.1 Each of these menus is named after the workout name from the Workout List menu. Clicking on the name allows you to rename it.
        2.10.2 A Play button is located at the top of the workout menu just below the name. Clicking on it Starts the workout.
        2.10.3 Each of the periods in the workout is contained in a vertidal list below the play button, starting with Prepare. These are horizontal square buttons with rounded corners. The name of the period is left justified. The timer of the period is right justified. Clicking on the name of the period allows you to rename it. Clicking on the timer of the period allows you to customize that period timer (by opening up on of the Time Period menus for that specific period).
        2.10.4 A back button is located at the top left that sends you back to the Workout List menu.
        2.10.5 A settings button is located at the top right that allows you to customize the Beep Tone, Beep Start, Halfway Reminder, 10 second Reminder, and Verbal Reminder settings for that specific workout.
    2.11 Settings Menu (Workout Specific)
        2.11.1 A setting called "Beep Tone" that allows you to customize the tone of the beeping that plays towards the end of a period.
        2.11.2 A setting called "Beep Start" that specifies how many seconds remaining in a period do the beeps start playing to signify the end of the period.
        2.11.3 A setting called "halfway reminder" that can be checked (default) or unchecked. It causes a voice to say "halfway" in the middle of a period.
        2.11.4 A setting called "10 second reminder" that can be checked (default) or unchecked. It causes a voice to say "10 seconds" at the 10 second remaining point in a period.
        2.11.5 A setting called "verbal reminder" that can be checked (default) or unchecked. It causes a voice to say "Work" or "Rest" at the start of a period depending on what period type it is.
        2.11.6 A done button at the bottom of the screen.
    2.12 Workout In Progress Menu
        2.12.1 The name of the workout at the top of the screen
        2.12.2 A back button in the top left
        2.12.3 A giant Pause button in the middle just below the workout name. Pressing the pause button pauses the workout and turns into a giant Play button. Pressing the giant play button resumes the workout and turns into a giant Pause button.
        2.12.4 A giant Skip Forward button to the right of the Pause button. It skips the workout forward 30 seconds, including moving into future periods.
        2.12.5 A giant Skip Backward button to the left of the Pause button. It skips the workout backwards 30 seconds, including moving into past periods.
        2.12.6 An in progress period bar below the giant Pause button, showing the name of the period left justified, the time remaining in the period right justified, and the internal fill color of the bar is depleting from right to left, revealing the background color. The timer is counting down from maximum to zero.
        2.12.7 The future period bars vertically in a list below the in progres period bar. All the period bars in progress or future are in the same aligned vertical list with consistent spacing between each. You can swipe the screen vertically to scroll through all the periods in the list. Clicking on them does nothing. The only way to navigate through the periods is by clicking the Skip Forward and Skip Backward buttons.

