realcomplete
============

**realcomplete** is an REAL powerfull autocompletion plugin for HTML form inputs.

Why another plugin ? 
--------------------

I needed an autocompletion plugin that deals with **diacritics**. I found some case insensitive ones, but none of them was abble to give me "libération" if I only wrote "liberation". This was my first and main motivation.

I also needed to be abble to **update de suggestions list while the user is writing**. Imagine you need the user to type 2 or 3 characters before getting a list of suggestions, according to these 3 characters. Some of the plugins I found could be updated, but not while the user is writing. Second motivation.

And additionnaly, I wanted my plugin to trig various interesting events (when opening, closing, typing, selecting a suggestion ... )

**realcomplete** does all that stuffs. Maybe not as perfect as some others, but this is my first plugin ever.

Requirements
------

**realcomplete** requires jQuery.

Usage
------

**realcomplete** is executed on a simple input (`<input type="texte" name="myInput">`)

pre. $(


API 
---

