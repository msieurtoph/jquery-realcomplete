# realcomplete


_realcomplete_ is an REAL powerfull autocompletion plugin for HTML form inputs.

Check the demo page : [http://jquery-realcomplete.farmercorp.com/](http://jquery-realcomplete.farmercorp.com/)

## Why another plugin ? 

I needed an autocompletion plugin that deals with **diacritics**. I found some case insensitive ones, but none of them was abble to give me "libération" if I only wrote "liberation". This was my first and main motivation.

I also needed to be abble to **update the suggestions list while the user is writing**. Imagine you need the user to type 2 or 3 characters before getting a list of suggestions, according to these 3 characters. Some of the plugins I found could be updated, but not while the user is writing. Second motivation.

And additionnaly, I wanted my plugin to trig various interesting events (when opening, closing, typing, selecting a suggestion ... )

_realcomplete_ does all that stuffs. Maybe not as perfect as some others, but this is my first plugin ever.

## Requirements

_realcomplete_ requires jQuery.

## Usages

_realcomplete_ is executed on a simple HTML input (`<input type="texte" name="myInput">`).

```
$('#myInput').realComplete(options).
// Create a new instance of dropdown autocompletion list on the set of inputs, if not existing.
// Or modify on the fly an existing one. No need to pass all options, only modified ones. 
// It returns an object with curent properties of the instance.
// See API, for options and returned object formats. 
```

```
$('#myInput').realComplete("destroy").
// Destroy the dropdown autocompletion list on the set of inputs, including all existing events. 
// To remain consistent with other uses, it also returns an empty object.
```

```
$('#myInput').realComplete().
// Nothing is done, it only returns the current properties.
```

## API 

### Options format  :
```
options (object) : 
{
  messages (object) : 
  { 
    loading (string) : message to display, when loading data (from options.load or options.data) (can be HTML code)
    noResult (string) : message to display, when no result (can be HTML code)
  }
  data (array) : set of search-in data for the input
  [
    {key:<key> (string), value:<value> (string)} : like a <select>, you can have key/value association
    or
    <value> (string) : value // if only one string, then key = value
  ] // you can mix the both types in the same set of data
  ajaxLoad (object) : information about dynamic load of data 
  {
    url (string) : url for ajax load of data, must return a JSON `options.data`compliant array. False if not needed. 
                  Each new load will entirely replace the existing set of data.
                  Take care of cross-browser and security limitations. Load only from servers you are authorised to. 
    data (object) : addional data to attach to the ajax request
  }
  verbose (boolean) : display trace in console (only for debug)
  infiniteLoop (boolean) : when reach the end of the dropdown list, go back to begin (true) or not (false)
  pageStep (integer) : step for page-up, page-down keys
  caseSensitive (boolean) : Search is case sensitive (true) or not (false). case sensitivity includes diacritics and ponctuations. 
  hiddenIfEmpty (boolean) : Do not open the dropdownlist (true), if there is no data (this.rawData is empty).
  displayKey (boolean) : For each suggestion, display the key (true) or not (false).
}

```

### Current Properties returned by `.realComplete()`

```
properties (object) :
{
  inputString          : current string in the $input.
  value                : current value in the inputClone, containing the key of the selected options
                         or = inputString if no option is selected 
  cleanInputString     : current string in the input after cleaning (lower case, diacritics removed, ... )
  dataCount            : count of data contained in the datalist, matching or not inputstring
  matchingDataCount    : count of data matching the inputString
  selectedOption       : name attribute of the selected option (false if no selected option)
  isOpen               : is the datalist dropdown open or not.
  options{}            : current options of the plugin ( = this.options)
  $highlightedOption   : jQuery Dom pointer to the currently highlighted <li> 
                         (usually the first of the list, or the one under the mouse)
  $datalist            : jQuery Dom pointer to the datalist dropdown (<ul>)
  $input               : jQuery Dom pointer to the initial input
  $inputClone          : jQuery Dom pointer to the hidden clone input 
  messages{}           : All the jQuery Dom pointer to the differents messages ($noResult, $loading ... ). 
}
```

## Events 

### Triggered events :
  `ready.realcomplete` : triggered at the end of the dropdown list creation (when calling $.realComplete() for the first time).
  
  `loaded.realcomplete` : triggered each time an ajaxLoad is executed.
  
  `updated.realcomplete` : triggered each time the module is updated, after update.
  
  `modified.realcomplete` : triggered each time the input string is modified (keyup, paste).
  
  `change` : triggered each time a option is selected (by clicking on it, or pressing the tab key or enter key)

  For each of them, the current properties object is added to the trig as parameter.

### Triggerable events :
  `open.realcomplete` : force the dropdownlist to open. No parameter needed
  
  `close.realcomplete` : force the dropdownlist to close. No parameter needed
  
  `update.realcomplete` : alias of $.realComplete(options) on already instanciated module. Parameter : options compliant object. 
  
  `destroy.realcomplete` : alias of $.realComplete("destroy"). No parameter needed

## Additional notes 

- RealComplete requires jQuery (and it has to be loaded before running).
- Input must to be something like `<input type="text" name="<name>">` for RealComplete to be used on it. I do not garantee any result on other kind of inputs
- RealComplete turns the `name` attribute to `data-name` attribute, because it creates another input with the original `name`, to save the key of the selected value (which can differ). 
- For better graphic experience, make sure the `margin-bottom` and `margin-left` styles of your input are null (= 0). 
- Dimensions, colorations and all styles come exclusively in the CSS file. You can modify it (at your own risk).  
- Events triggered inside (or triggerable from outside) are relative to the initial <input> :
```
$('#myInput').RealComplete(<option>); // not chainable, it returns current properties.
$('#myInput').bind('ready.realcomplete', myFunc); // to listen to ready.realcomplete event
 
$('#myInput').triggered('close.realcomplete'); // to trig the close.realcomplete event
```
- The instance of RealComplete class is attached to the initial input as `$(<input>).data('realComplete', <realCompleteInstance>)` and is accessible this way.
- When updating the `options.ajaxLoad`, make sure to provide a full object containing both data and url, not only one of them. 
     It may cause weird things with a complexe usage of this functionality.
- The diffrent messages are added and detached from the Dom. 
   They are not removed, so you can modify them even if not visible, using : `$(<input>).realComplete({messages:{noResult:'new message'}});`



## License

[BSD 2-Clause License](http://opensource.org/licenses/BSD-2-Clause). Copyright (c) 2014, Christophe POT. All rights reserved.
