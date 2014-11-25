/**
 * --------------- MAIN USAGE --------------------------------------
 *
 *   $(<input>).realComplete({..options..}): create a new instance of dropdown autocompletion list on the set of inputs, if not existing
 *                                            or modify on the fly an existing one. No need to pass all options, only modified ones.
 *                                            See API, for options possibilities.
 *                                            It returns an object with curent properties of the instance (See API)
 *
 *   ALTERNATIVE USAGES :
 *
 *   $(<input>).realComplete("destroy")    : destroy the dropdown autocompletion list on the set of inputs, including all existing events.
 *                                           to remain consistent with other uses, it returns an empty object.
 *
 *   $(<input>).realComplete()             : nothing is done, it only returns the current properties.
 *
 * --------------- NOTES --------------------------------------
 *
 *   1. RealComplete requires jQuery (and it has to be loaded before running).
 *   2. Input must to be something like `<input type="text" name="<name>">` for RealComplete to be used on it. I do not garantee any result on other kind of inputs
 *   2bis. RealComplete turns the name attribute to data-name attribute, because it creates another input with the original name to save the value of the selected label (which can differ).
 *   3. For better graphic experience, make sure the `margin-bottom` and `margin-left` styles of your input are null (= 0).
 *   4. Dimensions, colorations and all styles come exclusively in the CSS file. You can modify it (at your own risk).
 *   5. Events triggered inside (or triggerable from outside) are relative to the initial <input>.
 *        Ex.: $('#myInput').RealComplete(<option>); // not chainable, it returns current properties.
 *             $('#myInput').bind('ready.realcomplete', myFunc); // to listen to `ready.realcomplete` event
 *        Ex.: $('#myInput').triggered('close.realcomplete'); // to trig the `close.realcomplete` event
 *   6. The instance of RealComplete class is attached to the initial input as `$(<input>).data('realComplete', <realCompleteInstance>)` and is accessible this way.
 *   7. When updating the `options.ajaxLoad`, make sure to provide a full object containing both data and url, not only one of them.
 *        It may cause weird things with a complexe usage of this functionality.
 *   8. The diffrent messages (this.messages.$* = $noresult or $loading) are added and detached from the Dom.
 *      They are not removed, so you can modify them even if not visible, using : $(<input>).realComplete({messages:{noResult:'new message'}});
 * --------------- API --------------------------------------
 *
 * Options (object) :
 * {
 *   messages (object) :
 *   {
 *     loading (string)        : message to display, when loading data (from options.load or options.data) (can be HTML code)
 *     noResult (string)       : message to display, when no result (can be HTML code)
 *   }
 *   data (array) :
 *   [
 *     {
 *                key:<key> (string)
 *        value:<value> (string)
 *     }                       : like a <select>, you can have key/value association
 *     or
 *     <value> (string)        : if only one string, then key = value
 *                               // you can mix the both types in the same set of data
 *   ]
 *   ajaxLoad (object) :
 *   {
 *      url (string or false boolean)
                               : url for ajax load of data, must return a JSON `options.data`compliant array. False if not needed.
 *                               Each new load will entirely replace the existing set of data.
 *                               Take care of cross-browser and security limitations. Load only from servers you are authorised to.
 *      data (object)          : addional data to attach to the ajax request
 *   }
 *   verbose (boolean)         : display trace in console (only for debug)
 *   infiniteLoop (boolean)    : when reach the end of the dropdown list, go back to begin (true) or not (false)
 *   pageStep (integer)        : step for page-up, page-down keys
 *   caseSensitive (boolean)   : Search is case sensitive (true) or not (false). case sensitivity includes diacritics and ponctuations.
 *   hiddenIfEmpty (boolean)   : Don't open the dropdownlist (true), if there is no data (this.rawData is empty).
 *   displayKey (boolean)      : Display the key (true) or not (false) in the datalist dropdown.
 *   strictMode (boolean)      : If no option are selected : then the 'hidden' input stay empty
 * }
 *
 * Current Properties returned by .realComplete() (object) :
 * {
 *   inputString          : current string in the $input.
 *   value                : current value in the inputClone, containing the key of the selected options, or = inputString if no option is selected
 *   cleanInputString     : current string in the input after cleaning (lower case, diacritics removed, ... )
 *   dataCount            : count of data contained in the datalist, matching or not inputstring
 *   matchingDataCount    : count of data matching the inputString
 *   selectedOption       : name attribute of the selected option (false if no selected option)
 *   isOpen               : is the datalist dropdown open or not.
 *   options{}            : current options of the plugin ( = this.options)
 *   $highlightedOption   : jQuery Dom pointer to the currently highlighted <li> (usually the first of the list, or the one under the mouse)
 *   $datalist            : jQuery Dom pointer to the datalist dropdown (<ul>)
 *   $input               : jQuery Dom pointer to the initial input
 *   $inputClone          : jQuery Dom pointer to the hidden clone input
 *   messages{}           : All the jQuery Dom pointer to the differents messages ($noResult, $loading ... ).
 * }
 *
 * --------------- EVENTS --------------------------------------
 *
 * Triggered events :
 *   `ready.realcomplete` : triggered at the end of the dropdown list creation (when calling $.realComplete() for the first time).
 *   `loaded.realcomplete` : triggered each time an ajaxLoad is done.
 *   `failed.realcomplete` : triggered each time an ajaxLoad fails.
 *   `updated.realcomplete` : triggered each time the module is updated, after update.
 *   `modified.realcomplete` : triggered each time the input string is modified (keyup, paste).
 *   `change` : triggered each time a option is selected (by clicking on it, or pressing the tab key or enter key)
 *
 *   for each of them, the current properties object is added to the trig as parameter.
 *
 * Triggerable events :
 *   `open.realcomplete` : force the dropdownlist to open. No parameter needed
 *   `close.realcomplete` : force the dropdownlist to close. No parameter needed
 *   `update.realcomplete` : alias of $.realComplete(options) on already instanciated module. Parameter : `options`compliant object.
 *   `destroy.realcomplete` : alias of $.realComplete("destroy"). No parameter needed
 *
 * --------------------------------------
 *
 */

(function($){
    "use strict";

    $.fn.extend({
        realComplete:function(options){
            var rc = $(this).data('realComplete');
            if (rc) {
                if (!options) {
                    return rc.returnProperties();
                } else if ('destroy' === options) {
                    rc.destroy();
                    return {};
                } else {
                    rc.update(options);
                    return rc.returnProperties();
                }
            } else {
                $(this).data('realComplete', rc = new RealComplete($(this), options));
                return rc.returnProperties();
            }
        }
    });

    function RealComplete($input, options){

        // Default options (//deep copy)
        this.options = $.extend(true,{ messages : {loading : '-- Please wait during loading --'
                                                  ,noResult : '-- No result --'
                                                  }
                                        ,data : []
                                        ,verbose : false
                                        ,infiniteLoop : true
                                        ,pageStep : 10
                                        ,caseSensitive : false
                                        ,hiddenIfEmpty : true
                                        ,displayKey : true
                                        ,strictMode : false
                                        ,ajaxLoad : { url:false
                                                      ,data:{}
                                                    }
                                    }, options);
        ;

        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > new instance of realComplete on', $input[0].name, options);
        }
        this.$input = $input;

        // Start process
        this.init();
        this.update(this.options);

        this.fire('ready.realcomplete');

        if (this.options.verbose) {
            console.debug('RealComplete > End of constructor');
            console.groupEnd();
        }
    };

    RealComplete.prototype.init = function(){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > init');
            console.debug('RealComplete > options', this.options);
        }

        /* setup some default values */
        this.previousInputString = this.$input[0].value;  // previous inputString to compare when key is pressed on $input, or paste (default : the actual value of the $input)
        this.rawData = {};                      // raw initial data {<cleanValue>:{key:<key>, value:<value>, ... }
        this.$highlightedOption = false;        // $option currently highlighted
        this.selectedOption = false;            // option selected in the datalist (by mouseclick or <arrows>+Return/Tab)
        this.isOpen = true;                     // is the dropdown list open ? default = true (it will be closed during the creation)
        this.isOverOption = false;              // is the mouse over a dropdown list option?
        this.runningTasks = [];                 // list of running tasks (jQuery.deferred()) as ajaxLoading or other custom asynchronous jobs.
                                                // While updating or filtering, we wait for them to be ended (no matter they succeed or fail)
        this.dataCount = 0;                     // Count of options registered in the this.rawData
        this.matchingDataCount = 0;             // Count of options that match the inputString
        this.pageStep = 10;                     // Number of lines in a "page" of options. Used when press PgUp or PgDown.

        /* Clone input (to post keys instead of values to the form) */
        this.$inputClone = $('<input type="hidden" name="'+this.$input[0].name+'">');
        /* COMPATIBILITE IE8- */
        /* this.$input[0].dataset.name = this.$input[0].name; */
        this.$input[0].setAttribute('data-name', this.$input[0].name);
        /**********************/
        this.$input[0].name = '';
        this.$inputClone.insertBefore(this.$input);

        this.$input.addClass('realComplete');


        /* create the datalist */
        this.createDatalist();
        this.attachHandlers();

        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.returnProperties = function(){
        var props = {
                        inputString : this.$input[0].value,
                        value: this.$inputClone[0].value,
                        cleanInputString : this.getCleanString(this.$input[0].value),
                        dataCount:    this.dataCount,
                        matchingDataCount:    this.matchingDataCount,
                        selectedOption:    this.selectedOption,
                        isOpen:    this.isOpen,
                        options:    this.options,
                        $highlightedOption:    this.$highlightedOption,
                        $datalist:    this.$datalist,
                        $input:    this.$input,
                        $inputClone : this.$inputClone,
                        messages : this.messages
                    }
        if (this.options.verbose) {
            console.debug('RealComplete > returnProperties', props);
        }
        return props;
    };

    RealComplete.prototype.createDatalist = function(){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > createDatalist');
        }
        var _this = this;
        this.$datalist = $('<ul class="rc-datalist">')
                                        .insertAfter(this.$input)
                                        .on('mouseenter', '.rc-option', function(){ _this.highlightOption($(this)); _this.isOverOption = true;})
                                        .on('mouseenter', function(){ _this.isOverOption = true;})
                                        .on('mouseleave', function(){ _this.isOverOption = false;})
                                        .on('click'     , '.rc-option', function(){ _this.selectOption($(this));})
                                        ;
        this.closeDatalist();
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.openDatalist = function(){
        if (this.$datalist[0].children.length && !this.isOpen && !(this.options.hiddenIfEmpty && 0 === this.dataCount)) {
            if (this.options.verbose) {
                console.debug('RealComplete > openDatalist');
            }
            this.isOpen = true;
            this.$datalist.show();
            this.highlightOption(this.$datalist.find('.rc-option:visible').first());
            this.updateDisplay(true);
        }
    };

    RealComplete.prototype.closeDatalist = function(){
        if (this.options.verbose) {
            console.debug('RealComplete > closeDatalist');
        }
        if (this.isOpen){
            this.isOpen = false;
            this.$datalist.hide();
        }
    };

    RealComplete.prototype.updateDatalist = function(){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > updateDatalist');
        }
        var options = '', option;
        if (this.rawData){
            for(var i in this.rawData){
                option = this.rawData[i];
                options += '<li class="rc-option" data-clean-value="'+i+'">'
                                        +(option.value !== option.key && this.options.displayKey ? '<span class="rc-option-key">'+option.key+'</span>':'')
                                        +'<span class="rc-option-value">'+option.value+'</span>'
                                        +'</li>';
            }
        }
        this.$datalist[0].innerHTML = options;
        this.matchingDataCount = this.dataCount;
        this.$input[(0 === this.dataCount?'remove':'add')+'Class']('rc-has-data');
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.updateDisplay = function(includePositionning){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > updateDisplay');
        }

        if (0 === this.$datalist[0].children.length) {
            this.closeDatalist();
        }

        if (includePositionning){
            if (this.options.verbose) {
                console.debug('RealComplete > updateDisplay > positionning');
            }
            this.$datalist[0].style.top = this.$input[0].offsetTop + this.$input[0].offsetHeight - parseInt(0+this.$input[0].style.marginBottom)+'px';
            this.$datalist[0].style.left = this.$input[0].offsetLeft + parseInt(0+this.$input[0].style.marginLeft)+'px';
        }

        var data = this.$datalist[0], li = this.$highlightedOption[0];
        if (li){
            if (li.offsetTop < data.scrollTop){
                data.scrollTop = li.offsetTop;
            } else if (li.offsetTop + li.offsetHeight > data.scrollTop + data.offsetHeight) {
                data.scrollTop = li.offsetTop + li.offsetHeight - data.offsetHeight;
            }
        }
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.attachHandlers = function(){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > attachHandlers');
        }
        var _this = this;
        this.$input
                .on('keyup paste',function(e){
                                    if (!_this.filterKeyUp) {
                                        if (_this.options.verbose) {
                                            console.debug('RealComplete > attachHandlers > $input > keyup paste >', e.which, $(this)[0].value);
                                        }
                                        _this.processReleasedKeyEvent(e);
                                    }
                })
                .on({
                    'click':function(){
                                if (!_this.isOpen && 0 !== _this.dataCount) {
                                    _this.openDatalist();
                                } else {
                                    _this.closeDatalist();
                                }
                            },
                    'keydown':function(e){
                                            if (_this.options.verbose) {
                                                console.debug('RealComplete > attachHandlers > $input > keypress >',e.which);
                                            }
                                            _this.processPressedKeyEvent(e);
                                        },
                    'change':function(e){
                                            if (_this.options.verbose) {
                                                console.debug('RealComplete > attachHandlers > $input > change');
                                            }
                                            if (!_this.selectedOption) {
                                                _this.$inputClone[0].value = _this.options.strictMode ? '' : _this.$input[0].value;
                                            }
                                            if (0 < _this.matchingDataCount && !_this.selectedOption){
                                                // if no selectedOption and inputString is exactly matching an option, then select it and stop bubbling the change effect
                                                var $match = (_this.$datalist.find('[data-clean-value="'+_this.getCleanString(_this.$input[0].value)+'"]'));
                                                if (1 === $match.length){
                                                    if (_this.options.verbose) {
                                                        /* COMPATIBILITE IE8- */
                                                        /* console.debug('RealComplete > attachHandlers > $input > change > auto select',$match[0].dataset.cleanValue); */
                                                        console.debug('RealComplete > attachHandlers > $input > change > auto select',$match[0].getAttribute('data-clean-value'));
                                                        /***********************/
                                                    }
                                                    _this.selectOption($match);
                                                    e.stopImmediatePropagation();
                                                    e.preventDefault();
                                                }
                                            }
                                        },
                    'focusout':function(e){
                                        if (_this.options.verbose) {
                                            console.groupCollapsed('RealComplete > attachHandlers > $input > focusout');
                                        }
                                        // if isOverOption, the focus is lost but the dropdown list have to stay open to get the click on the option or the tab validation
                                        if (_this.isOverOption) {
                                            e.stopImmediatePropagation();
                                            e.preventDefault();
                                            _this.$input.focus();
                                        } else{
                                            _this.closeDatalist();
                                        }
                                        if (_this.options.verbose) {
                                            console.groupEnd();
                                        }
                                    },
                    'open.realcomplete':function(){_this.openDatalist();},
                    'close.realcomplete':function(){_this.closeDatalist();},
                    'update.realcomplete':function(e, options){_this.update(options);},
                    'destroy.realcomplete':function(){_this.destroy();}
                });

        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.processReleasedKeyEvent = function(e){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > processReleasedKeyEvent >', e.which);
        }
        if (this.previousInputString !== this.$input[0].value){
            this.$inputClone[0].value = '';
            this.selectedOption = false;
            this.applyFilter();
            this.openDatalist();
            this.updateDisplay();
            this.fire('modified.realcomplete');
            this.previousInputString = this.$input[0].value;
        }
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.processPressedKeyEvent = function(e){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > processPressedKeyEvent >', e.which);
        }

        this.filterKeyUp = true;
        if (40 === e.which && !this.isOpen) {
            this.openDatalist();
        } else {
            var $visibleOptions = this.$datalist.find('.rc-option:visible')
                    ,$highlightedOption = $visibleOptions.filter('.on').first();
            switch(e.which){
                case 27 : // Esc = close without validating
                    this.closeDatalist();
                    break;
                case 13 : // Enter
                case 9 : // Tab = valid the current highlightedOption (if different from previous one)
                    if (0 !== $highlightedOption.length) {
                        /* COMPATIBILITE IE8- */
                        //if ($highlightedOption[0].dataset.cleanValue !== this.$highlightedOption.dataset.cleanValue) {
                        if ($highlightedOption[0].getAttribute('data-clean-value') !== this.selectedOption) {
                        /***********************/
                            this.selectOption($highlightedOption);
                        }
                    }
                    if (!this.selectedOption) {
                        this.$inputClone[0].value = this.options.strictMode ? '' : this.$input[0].value;
                    }
                    this.updateDisplay();
                    break;
                case 38 :    // Up
                case 40 : // Down
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if (this.isOpen){
                        if (0 === $highlightedOption.length) {
                            this.highlightOption($visibleOptions[40 === e.which ? 'first':'last']());
                        } else {
                            var $newHighlightedOption = $highlightedOption[40 === e.which ? 'nextAll':'prevAll']('.rc-option:visible').first();
                            if (0 === $newHighlightedOption.length) {
                                $newHighlightedOption = this.options.infiniteLoop ? ($visibleOptions[40 === e.which ? 'first':'last']()) : $highlightedOption ;
                            }
                            this.highlightOption($newHighlightedOption);
                        }
                    }
                    this.updateDisplay();
                    break;
                case 33 :    // Pg Up
                case 34 : // Pg Down
                    if (this.isOpen){
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        if (0 === $highlightedOption.length) {
                            this.highlightOption($visibleOptions[34 === e.which ? 'first':'last']());
                        } else {
                            var $newHighlightedOption = $highlightedOption[34 === e.which ? 'nextAll':'prevAll']('.rc-option:visible').eq(Math.max(this.options.pageStep, 1) - 1);
                            if (0 === $newHighlightedOption.length) {
                                $newHighlightedOption = $visibleOptions[34 === e.which ? 'last':'first']();
                            }
                            this.highlightOption($newHighlightedOption);
                        }
                    }
                    this.updateDisplay();
                    break;
                default:
                    this.filterKeyUp = false;
                }
        }
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.destroy = function(){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > destroy');
        }
        this.$input[0].name = this.$inputClone[0].name;
        this.$input.off('**'); // delete all event on the input (may include some external delegate events)
                                                    // if needed, make sure to re-bind them after destroy or re-instanciate realComplete.
        this.$inputClone.remove();
        this.$datalist.remove();
        this.$input.removeData('realComplete');
        this.$input.removeClass('realComplete');
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.update = function(options){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > update', options);
        }
        if (options){
            var _this = this;
            this.processOptions(options);
            if (_this.options.verbose) {
                console.debug('RealComplete > update > waiting for running tasks ... ');
            }
            $.when.apply(null, this.runningTasks)
                        .always(function(){
                            if (_this.options.verbose) {
                                console.groupCollapsed('RealComplete > update > running tasks ended');
                                console.debug('RealComplete > update > new options', _this.options);
                            }
                            _this.applyFilter();
                            _this.updateDisplay(true);
                            _this.fire('updated.realcomplete');
                            if (_this.options.verbose) {
                                console.groupEnd();
                            }
                        });
        }
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.applyFilter = function(){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > applyFilter');
        }
        this.$inputClone[0].value = '';
        if (0 !== this.dataCount) {
            /* if option si selected */
            if (this.selectedOption){
                if (this.options.verbose) {
                    console.debug('RealComplete > applyFilter > option selected =', this.selectedOption);
                }
                this.$input[0].value = this.rawData[this.selectedOption].value;
                this.$inputClone[0].value = this.rawData[this.selectedOption].key;
                this.$input.focus();
            }
            /* then filter regarding the input value */
            var inputString = this.$input[0].value,
                    inputCleanString = this.getCleanString(inputString);
            if (this.options.verbose) {
                console.debug('RealComplete > applyFilter > inputString =',inputString);
                console.debug('RealComplete > applyFilter > inputCleanString =',inputCleanString);
                console.debug('RealComplete > applyFilter > previousInputString =',this.previousInputString);
                console.debug('RealComplete > applyFilter > caseSensitive =',this.options.caseSensitive);
            }
            if ('' !== inputString ? true : '' !== this.previousInputString) {
                this.matchingDataCount = 0;
                if (this.messages.$noResult) {
                    this.messages.$noResult.detach();
                }
                if (this.options.verbose) {
                    console.debug('RealComplete > applyFilter > something to filter');
                }
                if ('' === inputCleanString) {
                    var options = this.$datalist[0].children, i;
                    for (var i=0; i < options.length;i++){
                        options[i].style.display = 'block';
                    }
                    this.matchingDataCount = this.dataCount;
                } else {
                    var options = this.$datalist[0].children;
                    if (this.options.caseSensitive){
                        for (var i=0; i < options.length;i++){
                            /* COMPATIBILITE IE8- */
                            //if (options[i].dataset.cleanValue) {
                            if (options[i].getAttribute('data-clean-value')) {
                            /**********************/
                                if (options[i].innerHTML.indexOf(inputString) > -1) { //case sensitive search
                                    options[i].style.display = 'block';
                                    this.matchingDataCount++;
                                } else {
                                    options[i].style.display = 'none';
                                }
                            }
                        }
                    } else {
                        for (var i=0; i < options.length;i++){
                            /* COMPATIBILITE IE8- */
                            //if (options[i].dataset.cleanValue) {
                            //    if (options[i].dataset.cleanValue.indexOf(inputCleanString) > -1) { // case insensitive search on "data-clean-value" attribute
                            if (options[i].getAttribute('data-clean-value')) {
                                if (options[i].getAttribute('data-clean-value').indexOf(inputCleanString) > -1) { // case insensitive search on "data-clean-value" attribute
                            /**********************/
                                    options[i].style.display = 'block';
                                    this.matchingDataCount++;
                                } else {
                                    options[i].style.display = 'none';
                                }
                            }
                        }
                    }
                }
            }
            if (this.options.verbose) {
                console.debug('RealComplete > applyFilter > matchingDataCount =', this.matchingDataCount);
            }
            if (0 === this.matchingDataCount) {
                if (this.options.verbose) {
                    console.debug('RealComplete > applyFilter > noResult =', this.messages.$noResult);
                }
                this.$datalist.prepend(this.messages.$noResult || '');
                this.highlightOption();
            } else {
                if (this.options.verbose) {
                    console.debug('RealComplete > applyFilter > result =', this.messages.$noResult);
                }
                if (this.messages.$noResult) {
                    this.messages.$noResult.detach();
                }
                this.highlightOption(this.$datalist.find('.rc-option:visible').first());
            }
        } else {
            this.$datalist.prepend(this.messages.$noResult || '');
        }
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.highlightOption = function($option){
        if (this.$highlightedOption) {
            this.$highlightedOption.removeClass('on');
        }
        if ($option) {
            this.$highlightedOption = $option.addClass('on');
        }
    };

    RealComplete.prototype.selectOption = function($option){
        /* COMPATIBILITE IE8- */
        /* this.selectedOption = $option ? $option[0].dataset.cleanValue : false */
        this.selectedOption = $option ? $option[0].getAttribute('data-clean-value') : false;
        /**********************/
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > selectOption >', this.selectedOption);
        }
        this.isOverOption = false;
        this.applyFilter();
        this.closeDatalist();

        if (this.selectedOption) {
            this.previousInputString = this.$input[0].value;
            this.fire('change');
        }
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.processOptions = function(options){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > processOptions');
            console.debug('RealComplete > processOptions > options',options);
        }
        if ('object' !== typeof options) {
            if (this.options.verbose) {
                console.error('RealComplete > processOptions > wrong options', options);
            }
        } else if (options) {
            for(var o in options){
                this.options[o] = options[o];
                switch (o) {
                    case 'data' : this.processData(options.data); break;
                    case 'messages' : this.processMessages(options.messages); break;
                    case 'ajaxLoad' : this.processAjaxLoad(options.ajaxLoad); break;
                    default: break;
                }
            }
        }
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.processData = function(data){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > processData');
            console.debug('RealComplete > processData > data',data);
        }
        if ('object' !== typeof data) {
            if (this.options.verbose) {
                console.error('RealComplete > processData > wrong data', typeof data);
            }
        } else {
            this.$datalist.prepend(this.messages.$loading || '');

            var option, key, value, cleanValue;
            this.rawData = {};
            this.dataCount = 0;
            for(var d=0, len=data.length; d<len; ++d){
                option = data[d];
                if ('string' === typeof option) {
                    key = value = option;
                } else {
                    key = option.key;
                    value = option.value;
                }
                cleanValue = this.getCleanString(value);
                if (!this.rawData[cleanValue]) {
                    this.dataCount++;
                }
                this.rawData[cleanValue] = {key:key, value:value};
            }
            this.updateDatalist();
            if (this.selectedOption && !this.rawData[this.selectedOption]) {
                this.selectedOption = false;
            }
        }
        if (this.options.verbose) {
            console.debug('RealComplete > processData > Final data',this.rawData);
            console.debug('RealComplete > processData > Count data',this.dataCount);
            console.groupEnd();
        }
    };

    RealComplete.prototype.processMessages = function(messages){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > processMessages >',messages);
        }
        if (!this.messages) this.messages = {};
        for (var m in messages){
            if (this.messages['$'+m]) {
                this.messages['$'+m][0].innerHTML = messages[m];
            } else {
                this.messages['$'+m] = $('<li class="rc-'+m+'">'+messages[m]+'</li>');
            }
            if ('' === this.messages['$'+m][0].innerHTML) {
                this.messages['$'+m] = false;
            }
        }
        if (this.options.verbose) {
            console.debug('RealComplete > processMessages > Final messages',this.messages);
            console.groupEnd();
        }
    };

    RealComplete.prototype.processAjaxLoad = function(options){
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > processAjaxLoad');
            console.debug('RealComplete > processAjaxLoad > options',options);
        }

        if (!options.url) {
            if (this.options.verbose) {
                console.warn('RealComplete > processAjaxLoad > no url');
            }
        } else if ('string' === typeof options.url)  {
            this.$datalist.prepend(this.messages.$loading || '');
            var _this = this;
            this.runningTasks.push(
                $.getJSON( options.url, options.data || {})
                .done(function(buffer){
                    if (_this.options.verbose) {
                        console.groupCollapsed('RealComplete > processAjaxLoad > ended OK');
                        console.debug('RealComplete > processAjaxLoad > Returned buffer',buffer);
                    }
                    _this.processData(buffer);
                    _this.fire('loaded.realcomplete');
                    if (_this.options.verbose) {
                        console.groupEnd();
                    }
                })
                .fail(function(){
                    if (_this.options.verbose) {
                        console.groupCollapsed('RealComplete > processAjaxLoad > ended KO');
                        console.error('RealComplete > processAjaxLoad > Returned buffer', arguments);
                    }
                    _this.fire('failed.realcomplete');
                    if (_this.options.verbose) {
                        console.groupEnd();
                    }
                })
            );
        } else {
            if (this.options.verbose) {
                console.error('RealComplete > processAjaxLoad > wrong url', options.url);
            }
        }
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.fire = function(event, out){
        var props = this.returnProperties();
        if (this.options.verbose) {
            console.groupCollapsed('RealComplete > fire ');
            console.info('RealComplete > FIRED !! ', event, props, out);
        }
        this.$input.trigger(event, [props, out]);
        if (this.options.verbose) {
            console.groupEnd();
        }
    };

    RealComplete.prototype.getCleanString = function (str) {
        for(var i=0,len=this.diacriticsRemovalMap.length; i<len; ++i) {
            str = (str||'').replace(this.diacriticsRemovalMap[i].letters, this.diacriticsRemovalMap[i].base).toLowerCase();
        }
        return str;
    };

    RealComplete.prototype.diacriticsRemovalMap = [
            {base:'A', letters:/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
            {base:'AA',letters:/[\uA732]/g},
            {base:'AE',letters:/[\u00C6\u01FC\u01E2]/g},
            {base:'AO',letters:/[\uA734]/g},
            {base:'AU',letters:/[\uA736]/g},
            {base:'AV',letters:/[\uA738\uA73A]/g},
            {base:'AY',letters:/[\uA73C]/g},
            {base:'B', letters:/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
            {base:'C', letters:/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
            {base:'D', letters:/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
            {base:'DZ',letters:/[\u01F1\u01C4]/g},
            {base:'Dz',letters:/[\u01F2\u01C5]/g},
            {base:'E', letters:/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
            {base:'F', letters:/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
            {base:'G', letters:/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
            {base:'H', letters:/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
            {base:'I', letters:/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
            {base:'J', letters:/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
            {base:'K', letters:/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
            {base:'L', letters:/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
            {base:'LJ',letters:/[\u01C7]/g},
            {base:'Lj',letters:/[\u01C8]/g},
            {base:'M', letters:/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
            {base:'N', letters:/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
            {base:'NJ',letters:/[\u01CA]/g},
            {base:'Nj',letters:/[\u01CB]/g},
            {base:'O', letters:/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
            {base:'OI',letters:/[\u01A2]/g},
            {base:'OO',letters:/[\uA74E]/g},
            {base:'OU',letters:/[\u0222]/g},
            {base:'P', letters:/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
            {base:'Q', letters:/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
            {base:'R', letters:/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
            {base:'S', letters:/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
            {base:'T', letters:/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
            {base:'TZ',letters:/[\uA728]/g},
            {base:'U', letters:/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
            {base:'V', letters:/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
            {base:'VY',letters:/[\uA760]/g},
            {base:'W', letters:/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
            {base:'X', letters:/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
            {base:'Y', letters:/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
            {base:'Z', letters:/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
            {base:'a', letters:/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
            {base:'aa',letters:/[\uA733]/g},
            {base:'ae',letters:/[\u00E6\u01FD\u01E3]/g},
            {base:'ao',letters:/[\uA735]/g},
            {base:'au',letters:/[\uA737]/g},
            {base:'av',letters:/[\uA739\uA73B]/g},
            {base:'ay',letters:/[\uA73D]/g},
            {base:'b', letters:/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
            {base:'c', letters:/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
            {base:'d', letters:/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},
            {base:'dz',letters:/[\u01F3\u01C6]/g},
            {base:'e', letters:/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
            {base:'f', letters:/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
            {base:'g', letters:/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
            {base:'h', letters:/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
            {base:'hv',letters:/[\u0195]/g},
            {base:'i', letters:/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
            {base:'j', letters:/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
            {base:'k', letters:/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
            {base:'l', letters:/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
            {base:'lj',letters:/[\u01C9]/g},
            {base:'m', letters:/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
            {base:'n', letters:/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
            {base:'nj',letters:/[\u01CC]/g},
            {base:'o', letters:/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
            {base:'oi',letters:/[\u01A3]/g},
            {base:'ou',letters:/[\u0223]/g},
            {base:'oo',letters:/[\uA74F]/g},
            {base:'p', letters:/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
            {base:'q', letters:/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
            {base:'r', letters:/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
            {base:'s', letters:/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
            {base:'t', letters:/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
            {base:'tz',letters:/[\uA729]/g},
            {base:'u', letters:/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
            {base:'v', letters:/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
            {base:'vy',letters:/[\uA761]/g},
            {base:'w', letters:/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
            {base:'x', letters:/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
            {base:'y', letters:/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
            {base:'z', letters:/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g},
            {base:' ', letters:/[\u0020\u0028\u0029\u002D\u2014\u2013\u005F\u0009\u0022\u0027\u0060\u00B4\u2018\u2019\u201C\u201D]+/g},
            {base:'', letters:/^ /g}
        ];

})(jQuery);
