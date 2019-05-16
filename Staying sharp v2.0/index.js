//=========================================================================================================================================
// Dependencies 
//=========================================================================================================================================

'use strict';
const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
var dictionary = require('./dictionary.js');
var chunkingDictionary = require('./chunkingDictionary.js');


//=========================================================================================================================================
// Global variables
//=========================================================================================================================================

const APP_ID = 'amzn1.ask.skill.fffe719b-a18b-424e-884b-4fbacb8997fb';

const SKILL_NAME = 'Staying Sharp';
const WELCOME_MESSAGE =  'Welcome to Staying Sharp from AARP. We have two tracks, numbers and words. Which one would you like to try first?';
const HELP_MESSAGE = 'The words to remember from the original list are: ';
const HELP_REPROMPT = 'Please say the word you recognize, the words are: ';
const STOP_MESSAGE = "Thank you for using Staying Sharp, from AARP, a new member benefit. To learn more, go to Staying Sharp at AARP dot ORG";
const GAME_SELECTION_MESSAGE = 'Would you like to work with numbers or words?';
const INSTRUCTIONS_MESSAGE = 'I will read you a list of words. Researchers say creating a visual image of them in your mind helps! ';
const CONFUSED_REPROMPT = "If you are not sure what to do, you can ask me for some instructions."

const wordTIPS = ['While each list is being read to you, picture the words in your mind. ', 
              'Practice daily, and you\'ll gradually see improvement. ',
              'The difficulty of this exercise will increase only if you answer enough questions correctly. ',
              'Want to know why this works? The part of the brain responsible for working memory is also responsible for maintaining attention.\
               Both of these functions are closely linked as you must remember what you are supposed to pay attention to, and you must pay attention\
                in order to remember specific information. '];

const numTIPS = ['Chunking the numbers into smaller sized groups helps retain them. ', 
'Practice daily, and you\'ll gradually see improvement. ',
'The difficulty of this exercise will increase only if you answer enough questions correctly. ',
'Want to know why this works? The part of the brain responsible for working memory is also responsible for maintaining attention.\
 Both of these functions are closely linked as you must remember what you are supposed to pay attention to, and you must pay attention\
  in order to remember specific information. '];


var instructions = false;
var previousTipIndex = 1;
const HELP_MESSAGE_NUMBERS = 'The numbers to remember from the original list are: '
var transitionMessage = '';
var lastQuestionMessage = '';
var DEFAULT_WORDS_TO_REMEMBER_LENGTH = 7;
var DEFAULT_WORDS_TO_PICK_FROM_LENGTH = 3;
var MAX_NUMBER_TURNS = 3;
var MAX_NUMBER_TURNS_CHUNKING = 5;
var numCorrectAnswers = 0;
var num_CorrectWordAnswers = 0;
var num_CorrectNumAnswers = 0;
var numIncorrectAnswers = 0;
var num_IncorrectNumAnswers = 0;
var num_IncorrectWordAnswers = 0;
var gotchunkingQuestionCorrect = false;
var isChunkingGame = false;
var isWordGame     = false;
var leftoverChunkingRoundSpeech = "";
var percent_NumCorrect = 0;
var percent_WordCorrect = 0;
var cardObject = {
    "smallImageUrl": "https://i.pinimg.com/originals/db/bb/da/dbbbda6a772cee8e1e47662f4a288be0.jpg",
    "largeImageUrl": "https://i.pinimg.com/originals/db/bb/da/dbbbda6a772cee8e1e47662f4a288be0.jpg"
}

var tell_user_speech = ""

//Each difficulty maps to an array of the length of words. 
//Ex: Difficulty 1 maps to [10, 3], where 10 is the number of words to remember and 3 is the number of words to pick from.
//Javascript hashmaps force the keys to be strings :(
var currentDifficulty = 0;
var level = 1;
var difficulty_map = {};
difficulty_map['0'] = {wordsToRememberLength: 7, wordsToPickFromLength: 3};
difficulty_map['1'] = {wordsToRememberLength: 10, wordsToPickFromLength: 3};
difficulty_map['2'] = {wordsToRememberLength: 12, wordsToPickFromLength: 4};

var round = 0;
var numTurns = 0;
var chunkingWordLength = 4;
var wordsList = " ";
var wordsToRemember = "";
var exerciseSelectionFlag = false;
var randomNumber = "";
var isTip = false;
var finishedWordsGame = false;
var finishedNumbersGame = false; 
var endGame = false;
var fallback = false;
var wordsToPickFrom = "";
var setOfInstructions = "";
var levelupspeech = "";
//=========================================================================================================================================
// Helper functions
//=========================================================================================================================================

//test

/*
* QuizIntentHandler()
* DESCRIPTION  :    Controls the logic for the words exercise 
* PARAMETERS   :    -
* RETURN VALUE :    returns a list containing [speechOutput, list of wordsToPickFrom,  list of wordsToRemember]
*/
function QuizIntentHandler() {
    
    numTurns = numTurns + 1;
    
    var speechOutput = '';
    
    if (( Math.floor(num_CorrectWordAnswers / 2) > currentDifficulty) && (num_CorrectWordAnswers !== 0) && (currentDifficulty < 3)) {
        currentDifficulty += 1;
        speechOutput += 'Let\'s increase the difficulty. ';
    }
    
    var wordsToRememberLength = difficulty_map[currentDifficulty.toString()].wordsToRememberLength;
    var wordsToPickFromLength = difficulty_map[currentDifficulty.toString()].wordsToPickFromLength;
    
    var func_output = getQuestion(wordsToRememberLength, wordsToPickFromLength);
    // func_output => [speechOutput, wordsToPickFrom,  wordsToRemember];

    speechOutput += func_output[0];
    
    func_output[0] = speechOutput;
    
    
    return func_output;
}

/*
* getQuestion(wordsToRememberLength, wordsToPickFromLength)
* DESCRIPTION  :    Helper function for QuizIntent Handler(). Creates a list of words to practice the words exercise from and returns it with other information.
* PARAMETERS   :    wordsToRememberLength: Length of the words to remember , wordsToPickFromLength: Length of the words to pick from
* RETURN VALUE :    returns a list containing [speechOutput, list of wordsToPickFrom,  list of wordsToRemember]
*/
function getQuestion(wordsToRememberLength, wordsToPickFromLength) {
    
    var speechOutput = '';

    speechOutput =  'Listen to these ' + wordsToRememberLength + ' and try to remember each one. <break time=".9s" /> ';
        
    dictionary.generateWordLists(wordsToRememberLength, wordsToPickFromLength);
    
    wordsToRemember = dictionary.getWordsToRemember();
    wordsToPickFrom = dictionary.getWordsToPickFrom();
    
    for (var i = 0; i < wordsToRemember.length; i++) {
        speechOutput += wordsToRemember[i] + '<break time=".9s" /> ';
    }
    
    speechOutput += 'Now you\'ll hear ' + wordsToPickFromLength + ' more words. Repeat the word that you recognize from the original list. ';
    
    round = round + 1;
    
    for (var j = 0; j < wordsToPickFrom.length; j++) {
        speechOutput += wordsToPickFrom[j] + '<break time="0.9s" /> ';
    }
    
    // return value, a list containing speechOutput, the list of words to pick from and the list of words to remmber
    var func_output = [speechOutput, wordsToPickFrom,  wordsToRemember];
    
    return func_output;
}

/*
* generateRandomCompliment()
* DESCRIPTION  :    generates a random compliment from a list of given compliments
* PARAMETERS   :    -
* RETURN VALUE :    returns a random compliment as a string 
*/
function generateRandomCompliment(){
    var compliments = ['Great job! ', 'Perfect! ', 'Brilliant! ', 'Fantastic! ', 'Superb work! ', 'Wow! ', 'Bravo! ', 'Amazing! ', 'That\'s right! ', 'Eureka! ',
                        'Wonderful! ', 'Well done! ', '<audio src="soundbank://soundlibrary/human/amzn_sfx_crowd_applause_01"/>' + 'Fantastic! ', 'Way to go! ',
                        'You got it! ','<audio src="soundbank://soundlibrary/human/amzn_sfx_crowd_applause_01"/>' + 'Fantastic!', 'Correct! '
                        ]
    var rand_int = getRandomInt(0,compliments.length)

    if (compliments[rand_int]== 'Amazing! '){
        return compliments[rand_int] + '<break time="0.4s"/>. ';
    }

    return   '<say-as interpret-as="interjection">' +  compliments[rand_int] + '</say-as>'+ '<break time="0.4s"/>. ';
}


/*
* generateRandomMotivation()
* DESCRIPTION  :    generates a random 'it's okay' responses from a list of given responses
* PARAMETERS   :    -
* RETURN VALUE :    returns a random response as a string 
*/
function generateRandomMotivation(){

    var correctAnswer = dictionary.getCorrectAnswer() +'. '; 

    var motivations = [ '<say-as interpret-as="interjection">' + 'Darn!' + '</say-as>' + 'The correct answer was: ' + correctAnswer , 
                        '<say-as interpret-as="interjection">' + 'Bummer!' + '</say-as>' + ' The answer I wanted was ' + correctAnswer, 
                        'Maybe next time! The answer was : ' + correctAnswer,
                        'Oops, the answer I was looking for is ' + correctAnswer, 
                        'Good try, but the correct answer was: ' + correctAnswer, 
                        'Oh well, the correct answer was: '+ correctAnswer + '. Maybe next time! ',
                        '<say-as interpret-as="interjection">' + 'Oh dear!' + '</say-as>' +' The correct answer was: ' + correctAnswer
                        ]
    var rand_int = getRandomInt(0,motivations.length)

    return motivations[rand_int] + '<break time="0.4s"/>. ';
}

/*
* generateRandomMotivationNumbers()
* DESCRIPTION  :    generates a random 'it's okay' responses from a list of given responses for the numbers exercise
* PARAMETERS   :    -
* RETURN VALUE :    returns a random response as a string
*/
function generateRandomMotivationNumbers(){

    var speech = '';

    var correctAnswer = chunkingDictionary.getCurrentRandomNumber().toString();
    
    correctAnswer = '<say-as interpret-as= "digits">' + correctAnswer +'</say-as>'

    var motivations = [ '<say-as interpret-as="interjection">' + 'Darn!' + '</say-as>' + 'The correct answer was: ' + correctAnswer , 
                        '<say-as interpret-as="interjection">' + 'Bummer!' + '</say-as>' + ' The answer I wanted was ' + correctAnswer, 
                        'Maybe next time! The answer was : ' + correctAnswer,
                        'Oops, the answer I was looking for is ' + correctAnswer, 
                        'Good try, but the correct answer was: ' + correctAnswer, 
                        'Oh well, the correct answer was: '+ correctAnswer + '. Maybe next time! ',
                        '<say-as interpret-as="interjection">' + 'Oh dear!' + '</say-as>' +' The correct answer was: ' + correctAnswer
                        ]
    var rand_int = getRandomInt(0,motivations.length);

    return motivations[rand_int] + '<break time="0.4s"/>. '; 
}

/*
* answerIntentHandler(userAnswer, wordsToPickFromLength)
* DESCRIPTION  :    Takes the user's spoken answer as an input and takes actions depending on whether the answer is correct or incorrect
* PARAMETERS   :    userAnswer, wordsToPickFromLength
* RETURN VALUE :    returns the speechOutput generated 
*/
function answerIntentHandler(userAnswer, wordsToPickFromLength) {
    var speechOutput = '';
    var isCorrectAnswer = dictionary.getCorrectAnswer() == userAnswer;
   
    if (isCorrectAnswer) {
        speechOutput += generateRandomCompliment();
        numCorrectAnswers = numCorrectAnswers + 1;
        num_CorrectWordAnswers = num_CorrectWordAnswers +1;
    }
    else {
        speechOutput += generateRandomMotivation();
        numIncorrectAnswers = numIncorrectAnswers + 1;
        num_IncorrectWordAnswers = num_IncorrectWordAnswers + 1;
    }
    
    lastQuestionMessage = speechOutput;
    
    if (round < 3) {
        speechOutput += 'Here are ' + wordsToPickFromLength + ' more words. ';
        
        dictionary.populateWordsToPickFrom(wordsToPickFromLength);
        wordsToPickFrom = dictionary.getWordsToPickFrom();
                
        for (var j = 0; j < wordsToPickFrom.length; j++) {
            speechOutput += wordsToPickFrom[j] + '<break time="0.9s" /> ';
            wordsList += '<break time="0.9s" /> ' + wordsToPickFrom[j];
        }
        
        round = round + 1;
    } else {
        
        speechOutput += 'Let\'s try a new category of words. ';
        round = 0;
        transitionMessage = speechOutput;
    }
    
    return speechOutput;
}


/*
* stopIntentHandler()
* DESCRIPTION  :    Ends the current session of the memory exercise
* PARAMETERS   :    -
* RETURN VALUE :    returns the speechOutput generated and the percentage of questions answered correctly
*/
function stopIntentHandler() {
    var percentCorrect = 0;
    if (numCorrectAnswers + numIncorrectAnswers > 0) {
        percentCorrect = numCorrectAnswers / (numCorrectAnswers + numIncorrectAnswers) * 100;
        percent_NumCorrect = num_CorrectNumAnswers / (num_CorrectNumAnswers + num_IncorrectNumAnswers) * 100;
        percent_WordCorrect = num_CorrectWordAnswers / (num_CorrectWordAnswers + num_IncorrectWordAnswers) * 100;
    }
  
    percentCorrect = Math.floor(percentCorrect);
    percent_NumCorrect = Math.floor(percent_NumCorrect);
    percent_WordCorrect = Math.floor(percent_WordCorrect);
    var speechOutput = '';
    
    if (dictionary.getPreviousCorrectAnswers().length != 0) {
        speechOutput += lastQuestionMessage;
        lastQuestionMessage = '';
    }
    
    speechOutput += 'Lets end the exercise here. ';
    
    if(percent_NumCorrect != 0 && isNaN(percent_NumCorrect) == false){   
    speechOutput += 'You got ' + percent_NumCorrect +  ' percent right in the numbers game. ';       
    }
    if(percent_WordCorrect != 0 && isNaN(percent_WordCorrect) == false){
        speechOutput += 'In the words game, you got ' + percent_WordCorrect +  ' percent of the questions correct. ';
        //speechOutput += 'in ' + numTurns + ' different word categories. ';
        //speechOutput += 'You ended the game at level ' + level + '.  ';
    }
    
    
    speechOutput += STOP_MESSAGE;
        
    gotchunkingQuestionCorrect = false;
    numCorrectAnswers = 0;
    numIncorrectAnswers = 0;
    currentDifficulty = 0;
    numTurns = 0;
    round = 0;
    finishedNumbersGame = false;
    finishedWordsGame = false;
    var func_output = [speechOutput, percentCorrect];
    return func_output;
}

/*
* getRandomInt(min, max)
* DESCRIPTION  :    Generates a random integer between the minimum and the maximum provided (inclusive)
* PARAMETERS   :    min,max
* RETURN VALUE :    returns the randomly generated integer
*/
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/*
* tipIntentHandler() 
* DESCRIPTION  :    Provides the user with a tip and suggests starting with a new exercise
* PARAMETERS   :    -
* RETURN VALUE :    returns the speechOutput generated
*/
function tipIntentHandler() {
    var speechOutput = '';
    isTip = true;
    var randomIndex = getRandomInt(0,wordTIPS.length);
    
    while (randomIndex == previousTipIndex) {
        randomIndex = getRandomInt(0,wordTIPS.length);
    }
    previousTipIndex = randomIndex;
    
    if(isWordGame){
    speechOutput = wordTIPS[randomIndex];
    }

    else{
        speechOutput = numTIPS[randomIndex];
    }

    speechOutput += 'Should we start with a new exercise? ';
    
    numCorrectAnswers = 0;
    numIncorrectAnswers = 0;
    currentDifficulty = 0;
    numTurns = 0;
    round = 0;
    
    speechOutput += '';
    
    return speechOutput;
}

/*
* chunkingExerciseIntentHandler() 
* DESCRIPTION  :    handles the logic for the number chunking exercise
* PARAMETERS   :    -
* RETURN VALUE :    returns the speechOutput generated
*/
function chunkingExerciseIntentHandler() {
    var speechOutput = "";
    
    randomNumber = chunkingDictionary.getRandomNumber(chunkingWordLength).toString();
        
    speechOutput += 'I will say a series of numbers. After I\'m done, I\'ll ask you to repeat back the numbers in the sequence I said them.\
      Here\'s a tip:  If you break up long numbers into smaller groups, they’re easier to remember. <break time="0.15s"/>';
    
    for (var i = 0; i < chunkingWordLength; i++) {
        speechOutput += randomNumber[i];
        speechOutput += '<break time="0.40s"/>. ';
    }
    
    numTurns += 1;
    
    return speechOutput;
}


/*
* chunkingDifficultySetter()
* DESCRIPTION  :    helper function within userNumberAnswerIntentHandler() to decrease the exercise difficulty 
* PARAMETERS   :    -
* RETURN VALUE :    returns the speechOutput generated
*/
function chunkingDifficultySetter() {
    
    var speechOutput = "";

    if (gotchunkingQuestionCorrect && chunkingWordLength < 10) {
        chunkingWordLength += 1;
        speechOutput += 'Let\'s increase the difficulty by adding 1 more number. ';
    } else if (chunkingWordLength > 4) {
        chunkingWordLength -= 1;
        speechOutput += 'Let\'s decrease the difficulty by removing 1 number. ';
    } 
    
    return speechOutput;
}

/*
* userNumberAnswerIntentHandler(userAnswer)
* DESCRIPTION  :    Accepts the userAnswer and verifies it, deciding to increase or decrease difficulty depending on its correctness
* PARAMETERS   :    userAnswer
* RETURN VALUE :    returns the speechOutput generated
*/
function userNumberAnswerIntentHandler(userAnswer) {
    
    var speechOutput = "";
    var isCorrectAnswer = (chunkingDictionary.getCurrentRandomNumber() == userAnswer);
    
    if (isCorrectAnswer) {
        speechOutput += generateRandomCompliment();
        gotchunkingQuestionCorrect = true;
        numCorrectAnswers = numCorrectAnswers + 1;
        num_CorrectNumAnswers = num_CorrectNumAnswers + 1;
    }
    
    else {
        speechOutput += generateRandomMotivationNumbers();
        gotchunkingQuestionCorrect = false;
        numIncorrectAnswers = numIncorrectAnswers + 1;
        num_IncorrectNumAnswers = num_IncorrectNumAnswers + 1;
    }
    
    if (numTurns >= MAX_NUMBER_TURNS_CHUNKING) {
        leftoverChunkingRoundSpeech = speechOutput;
        return speechOutput;
    } else {
        
        speechOutput += chunkingDifficultySetter();
        randomNumber = chunkingDictionary.getRandomNumber(chunkingWordLength).toString();
        speechOutput += 'I will read you a number that is ' + chunkingWordLength + ' digits long. <break time="0.15s"/> ';

        for (var i = 0; i < chunkingWordLength; i++) {
            speechOutput += randomNumber[i];
            speechOutput += '<break time="0.40s"/>. ';
        }

        numTurns += 1;
        return speechOutput;
    }
}

/*
* resestExerciseVariables() 
* DESCRIPTION  :    cleanup function to reset all variables in case of a game restart. 
* PARAMETERS   :    -
* RETURN VALUE :    -
*/
function resestExerciseVariables() {

    //exerciseSelectionFlag = false;
    wordsList = " "
    wordsToRemember = "";
    previousTipIndex = 2;
    transitionMessage = '';
    lastQuestionMessage = '';
    gotchunkingQuestionCorrect = false;
    isChunkingGame = false;
    isWordGame     = false;
    leftoverChunkingRoundSpeech = "";
    currentDifficulty = 0;
    round = 0;
    chunkingWordLength = 4;
    endGame = false;
    instructions = false;
    setOfInstructions = "";
    levelupspeech = "";
}

/*
* exerciseCompleted() 
* DESCRIPTION  : Carries through the logic for speech output and game commencement when an exercise is finished   
* PARAMETERS   : -   
* RETURN VALUE : returns the speech output on the commencement of the first game. 
*/
function exerciseCompleted(){

    if (finishedNumbersGame && finishedWordsGame){
        
        endGame = true;
        return "";
    }

    var isWordGameLocal = false;
    var isChunkingGameLocal = false;

    if (isChunkingGame == true){
        isWordGameLocal = true;
    }
    if (isWordGame == true){
        isChunkingGameLocal = true;
    }


    var percentCorrect = 0;
    if (numCorrectAnswers + numIncorrectAnswers > 0) {
        percentCorrect = numCorrectAnswers / (numCorrectAnswers + numIncorrectAnswers) * 100;
        percent_NumCorrect = num_CorrectNumAnswers / (num_CorrectNumAnswers + num_IncorrectNumAnswers) * 100;
        percent_WordCorrect = num_CorrectWordAnswers / (num_CorrectWordAnswers + num_IncorrectWordAnswers) * 100;
    }
  
    percentCorrect = Math.floor(percentCorrect);
    percent_NumCorrect = Math.floor(percent_NumCorrect);
    percent_WordCorrect = Math.floor(percent_WordCorrect);
    var speechOutput = '';
    
    if (dictionary.getPreviousCorrectAnswers().length != 0) {
        speechOutput += lastQuestionMessage;
        lastQuestionMessage = '';
    }
    
    var exerciseName = ""
    var otherExercise = ""
    if (finishedNumbersGame== true){
        exerciseName = "numbers exercise";
        otherExercise = "words exercise"
        isWordGameLocal = true;
    }

    else {
        exerciseName = "words exercise";
        otherExercise = "numbers exercise"
        isChunkingGameLocal = true;
    }

    speechOutput += "You finished the " +  exerciseName +", <say-as interpret-as='interjection'> congratulations! </say-as>"
    
    if(isChunkingGame && (percent_NumCorrect != 0 && isNaN(percent_NumCorrect) == false)){   
    speechOutput += 'You got ' + percent_NumCorrect +  ' percent right in the numbers game. ';       
    }
    if(isWordGame && (percent_WordCorrect != 0 && isNaN(percent_WordCorrect) == false)){
        speechOutput += 'In the words game, you got ' + percent_WordCorrect +  ' percent of the questions correct. ';
        //speechOutput += 'in ' + numTurns + ' different word categories. ';
        //speechOutput += 'You ended the game at level ' + (currentDifficulty + 1) + '.  ';
    }
    
    speechOutput += ' Would you like to try your hand at the ' + otherExercise +' next?' ;
    numTurns = 0; 
    level = currentDifficulty+1;   
    resestExerciseVariables();
    isWordGame = isWordGameLocal;
    isChunkingGame = isChunkingGameLocal;

    exerciseSelectionFlag = true;

    return speechOutput;


}



//=========================================================================================================================================
// Intents and handlers
//=========================================================================================================================================

const handlers = {

    'LaunchRequest': function () {
        numCorrectAnswers = 0;
        numIncorrectAnswers = 0;
        num_CorrectWordAnswers = 0;
        num_CorrectNumAnswers = 0;
        percent_NumCorrect = 0;
        percent_WordCorrect = 0;
        num_IncorrectNumAnswers = 0;
        num_IncorrectWordAnswers = 0;
        endGame = false;
        numTurns = 0;
        resestExerciseVariables();
        finishedNumbersGame = false;
        finishedWordsGame = false;
        exerciseSelectionFlag = false;
        this.emit('StartIntent');
        this.emit(':responseReady');
    },
    
    'StartIntent': function (){
        exerciseSelectionFlag = false;
        var speechOutput = "";
        speechOutput += tell_user_speech
        speechOutput += WELCOME_MESSAGE
        var confirm = 'Would you like to start with the numbers track or the words track?'
        this.response.speak(speechOutput).listen(confirm).cardRenderer("Staying Sharp", "Welcome to Staying Sharp by AARP",cardObject);
        this.emit(':responseReady');
    },
    
   'AMAZON.YesIntent': function (){
        if(isTip){
           isTip = false;
           this.emit('RestartIntent');
           this.emit(':responseReady');   

        }
        if(finishedNumbersGame){
            
            this.emit('QuizIntent');
            this.emit(':responseReady');    
        }
        if(finishedWordsGame){
            
            this.emit('ChunkingExerciseIntent');
            this.emit(':responseReady');  
        }
        if(instructions){

            setOfInstructions =" You can say <emphasis>stop</emphasis> at any time to end the game. To start the game again you can say <emphasis>restart</emphasis>. \
            If you forget the series of ";
            if(isWordGame || finishedNumbersGame){
                setOfInstructions += "words ";
            }
            if(isChunkingGame || finishedWordsGame){
                setOfInstructions += "numbers ";
            }
            if(isChunkingGame == false && isWordGame == false){
                setOfInstructions += "numbers or words ";
            }

            setOfInstructions += "you can ask me for help or say <emphasis>I don't know</emphasis>. You can also ask me for tips and hints. Let's get back to the game! ";
    
            if(isWordGame || finishedNumbersGame){
                this.emit('QuizIntent');
            }
            if(isChunkingGame  || finishedWordsGame){
                this.emit('ChunkingExerciseIntent');
            }
            if(isChunkingGame == false && isWordGame == false){
                this.response.speak(speechOutput).listen('Would you like to work with words or numbers? ');
                this.emit(':responseReady');
            }
        }
        else{
            var speechOutput = GAME_SELECTION_MESSAGE;
            resestExerciseVariables();
            this.response.speak(speechOutput).listen('Say if you want to exercise with words or numbers ');
            this.emit(':responseReady');
        }
    },
    
    'AMAZON.NoIntent': function (){
        if(instructions){

            setOfInstructions = "Let's get back to the game! ";


            if(isWordGame){
                this.emit('QuizIntent');
            }
            if(isChunkingGame){
                this.emit('ChunkingExerciseIntent');
            }
            if(isChunkingGame == false && isWordGame == false){
                this.response.speak(speechOutput).listen('Would you like to work with words or numbers? ');
                this.emit(':responseReady');
            }
        }
        this.emit('AMAZON.StopIntent');
        this.emit(':responseReady');
            
        
    },
    
    
    'ExerciseSelectionIntent': function (){

        var exerciseType = this.event.request.intent.slots.exercise.value;
        resestExerciseVariables();
        
        if (exerciseType == 'words') {
            this.emit('QuizIntent');    
        } 
        else {
            this.emit('ChunkingExerciseIntent');
        }
    },
    
    'ChunkingExerciseIntent': function () {
        isChunkingGame = true;
        isWordGame     = false;
        var reprompt = 'You can say the number you remember. ' + CONFUSED_REPROMPT;
        if(instructions){
            instructions = false;
            var speechOutput = "The numbers to remember are: "
            for (var i = 0; i < chunkingWordLength; i++) {
                speechOutput += randomNumber[i];
                speechOutput += '<break time="0.40s"/>. ';
                }
            speechOutput = setOfInstructions +  speechOutput;
            this.response.speak(speechOutput).listen(reprompt);
            this.emit(':responseReady');
            }
        else{
        var speechOutput= chunkingExerciseIntentHandler();
        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
        }
    },
    
    'QuizIntent': function () {

        exerciseSelectionFlag = true;
        isWordGame     = true;
        isChunkingGame = false;
        var speechOutput = " " + levelupspeech;
        if(instructions){
            instructions = false;
                
            var speechOutput = "";
            speechOutput =  'The words to remember are: ';
            var reprompt = "You can say the word you recognize, the words are: ";
            
            for (var i = 0; i < wordsToRemember.length; i++) {
                speechOutput += wordsToRemember[i] + '<break time=".9s" /> ';
            }
            
            speechOutput += 'Repeat the word that you recognize from the original list. ';
            
            for (var j = 0; j < wordsToPickFrom.length; j++) {
                speechOutput += wordsToPickFrom[j] + '<break time="0.9s" /> ';
                reprompt += wordsToPickFrom[j] + '<break time="0.9s" /> ';
            }

            reprompt = reprompt +  " " + CONFUSED_REPROMPT;            
            
            speechOutput = setOfInstructions + speechOutput;
            this.response.speak(speechOutput).listen(reprompt);
            this.emit(':responseReady');   
        }
        else{
            if (numTurns == 0) {
                speechOutput += INSTRUCTIONS_MESSAGE;
                
            }
        
            var func_output = QuizIntentHandler();
            
            speechOutput += func_output[0];
            
            var reprompt = "You can say the word you recognize, the words are: ";
            
            reprompt += '<break time="0.9s"/>'+ func_output[1]  ;
            
            reprompt = reprompt +  " " + CONFUSED_REPROMPT;

            this.response.speak(speechOutput).listen(reprompt);
                    
            if ((numTurns + 1) > MAX_NUMBER_TURNS) {
                finishedWordsGame = true;
                var speechOutput = "";
                var reprompt = "";
                speechOutput += exerciseCompleted();
                
                reprompt += "Would you like to try the numbers exercise?";
                if (endGame==true){
                    this.emit('AMAZON.StopIntent');
                }
                else{
                    this.response.speak(speechOutput).listen(reprompt);
                    this.emit(':responseReady');   
                } 
            }
            
            if (dictionary.getPreviousCorrectAnswers().length != 0) {
                speechOutput += transitionMessage;
                transitionMessage = '';
            }
            


            this.emit(':responseReady');    
        }
    },
    
    'UserNumberAnswerIntent': function() {

        var answer = this.event.request.intent.slots.Number.value;
        
        if (isWordGame){
          this.emit('QuizIntent');
        }
        
        
        if (numTurns >= MAX_NUMBER_TURNS_CHUNKING) {
        
            leftoverChunkingRoundSpeech = userNumberAnswerIntentHandler(answer);
            finishedNumbersGame = true;
            var speechOutput = leftoverChunkingRoundSpeech;
            var reprompt = "";
            speechOutput += exerciseCompleted();
            reprompt += "Would you like to try the words exercise?";
            if (endGame==true){
                this.emit('AMAZON.StopIntent');
            }
            else{
                this.response.speak(speechOutput).listen(reprompt);
                this.emit(':responseReady');   
            }

            //this.emit('AMAZON.StopIntent');
        } else {

            var speechOutput = userNumberAnswerIntentHandler(answer);
        
            var reprompt = 'You can say the number you remember. ' + CONFUSED_REPROMPT;

            this.response.speak(speechOutput).listen(reprompt);
            this.emit(':responseReady');     
        }
    },
        
    'UserAnswerIntent': function () {
        wordsList = " ";
       
        if (exerciseSelectionFlag==false){
            tell_user_speech += "Sorry, I didn't catch that. "
            this.emit('StartIntent');
        }


        if (isChunkingGame){
            this.emit('ChunkingExerciseIntent');
        }
        
        var answer = this.event.request.intent.slots.answer.value;
        levelupspeech = ""; //'<strong>';
        
        levelupspeech += answerIntentHandler(answer, difficulty_map[currentDifficulty.toString()].wordsToPickFromLength);
        
        var reprompt = "You can say the word you recognize, the words are: ";
        
        reprompt += wordsList;
        //speechOutput += '</strong>';
        reprompt = reprompt + ". " + CONFUSED_REPROMPT;

        this.response.speak(levelupspeech).listen(reprompt); //Alexa will not take successive this.response.speak() calls, it will use the most recent one.
        
        if (round <= 0) {
            this.emit('QuizIntent');    
        } else {
            this.emit(':responseReady');
        }
    },
    
    'TipIntent' : function () {
        var speechOutput = tipIntentHandler();
        this.response.speak(speechOutput).listen('Should we keep playing?');
        this.emit(':responseReady');
    },
    
    'AMAZON.HelpIntent': function () {
        if (isWordGame){
            var speechOutput = HELP_MESSAGE;
            for (var i = 0; i < wordsToRemember.length; i++) {
                speechOutput += wordsToRemember[i] + '<break time=".9s" /> ';
            }
            var reprompt = HELP_REPROMPT;
            reprompt += wordsList;
            if (fallback == true){
                fallback = false;
                speechOutput = 'Sorry, I didn\'t catch that. ' + speechOutput;
            }
            this.response.speak(speechOutput).listen(reprompt);
            this.emit(':responseReady');
        } else{
            var speechOutput = HELP_MESSAGE_NUMBERS;
            var reprompt = HELP_MESSAGE_NUMBERS;
            for (var i = 0; i < randomNumber.length; i++) {
                speechOutput += randomNumber[i] + '<break time=".9s" /> ';
                reprompt += randomNumber[i] + '<break time=".9s" /> ';
            }
            if (fallback == true){
                fallback = false;
                speechOutput = 'Sorry, I didn\'t catch that. ' + speechOutput;
            }
            this.response.speak(speechOutput).listen(reprompt);
            this.emit(':responseReady');
        }
    },
    
    'AMAZON.StopIntent': function () {
        var func_output = stopIntentHandler();
        var speechOutput = func_output[0];
        // if ((numTurns >= MAX_NUMBER_TURNS && isWordGame) || (numTurns >= MAX_NUMBER_TURNS_CHUNKING && isChunkingGame) ){
        //     speechOutput = leftoverChunkingRoundSpeech + speechOutput;
        // }
        var card_data = func_output[1];
        finishedNumbersGame = false;
        finishedWordsGame = false;
        numCorrectAnswers = 0;
        numIncorrectAnswers = 0;
        num_CorrectWordAnswers = 0;
        num_CorrectNumAnswers = 0;
        num_IncorrectNumAnswers = 0;
        num_IncorrectWordAnswers = 0;
        numTurns = 0;
        resestExerciseVariables();
        this.emit(':tell', speechOutput);
    },
    
    'InstructionsIntent': function () {
        instructions = true;
        var speechOutput = 'It seems like you are confused. I will read you a set of instructions and then ask you if you want to continue the game. \
        We have two tracks called <emphasis>numbers</emphasis> and <emphasis>words</emphasis>. '

        if (isChunkingGame==false && isWordGame ==false){
            speechOutput += 'You can choose either one. Just say <emphasis>words</emphasis> to start the words exercise and <emphasis>numbers</emphasis> to start the numbers exercise. '
            var reprompt = "You can say <emphasis>words</emphasis> to start the words exercise and <emphasis>numbers</emphasis> to start the numbers exercise. ";
            this.response.speak(speechOutput).listen(reprompt);
            this.emit(':responseReady');
        }


        if (isWordGame){
            speechOutput += 'You are currently in the <emphasis>words</emphasis> track. In the words track, I will say a series of 7 words and ask you to remember them. <break time="0.25s" />\
            Then I will say a series of three words, only one of which belongs to the original list. You must say the word you recognise to be from the original list. '
        }
        if (isChunkingGame){
            speechOutput += 'You are currently in the <emphasis>numbers</emphasis> track. I will say a series of numbers and ask you to remember them. Once I\'m \
            done, I will ask you to repeat the series of numbers you heard. '
        }


        speechOutput += 'If you answer the questions correctly, the exercises will increase in difficulty.<break time=".5s" />';
        
        speechOutput += ' Would you like to hear a series of commands?';

        var reprompt = "Say <emphasis>yes</emphasis> to continue the game from where you left off.";
        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');

    },
    
    'RestartIntent': function () {
        numCorrectAnswers = 0;
        numIncorrectAnswers = 0;
        num_CorrectWordAnswers = 0;
        num_CorrectNumAnswers = 0;
        num_IncorrectNumAnswers = 0;
        num_IncorrectWordAnswers = 0;
        numTurns = 0;
        resestExerciseVariables();
        exerciseSelectionFlag = false;
        this.emit('StartIntent');
        this.emit(':responseReady');
    },
    
    'CancelIntent': function () {
        this.emit('AMAZON.StopIntent');
        this.emit(':responseReady');
    },
    
    'AMAZON.NavigateHomeIntent': function() {
        resestExerciseVariables();
        this.emit('StartIntent');
        this.emit(':responseReady');
    },
    
    'AMAZON.FallbackIntent': function () {
        fallback = true;
        this.emit('AMAZON.HelpIntent');
        this.emit(':responseReady');

    },

    'Unhandled': function () {
        var speechOutput = STOP_MESSAGE;
        this.response.speak(speechOutput);
    }
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};