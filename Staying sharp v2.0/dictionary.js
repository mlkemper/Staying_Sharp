    var categories = ['animals', 'school', 'sports', 'body', 'computer', 'clothes'];
    
    
    var dictionary = [
                        [ 'woodchuck', 'rhino', 'cat', 'elephant', 'monkey', 'buffalo', 'walrus', 'dog', 'leopard', 'panther', 'parakeet', 'flamingo', 'tiger', 'starfish', 'iguana', 'shark', 'aardvark', 'cow', 'frog', 'parrot'],
                        [ 'arithmetic', 'calculator', 'desk', 'grades', 'highlighter', 'library', 'map', 'pencil', 'protractor', 'question', 'student', 'teacher', 'principal', 'encyclopedia', 'parrot', 'experiment', 'exam', 'geography', 'homework', 'lunch'],
                        [ 'archery', 'badminton', 'baseball', 'basketball', 'boxing', 'golf', 'karate', 'swimming', 'rowing', 'track', 'tennis', 'weightlifting', 'squash', 'dancing', 'softball', 'ping-pong', 'bowling', 'cricket', 'handball', 'gymnastics'],
                        [ 'ankle', 'arm', 'back', 'beard', 'blood', 'body', 'bone', 'brain', 'cheek', 'chest', 'chin', 'ear', 'elbow', 'eye', 'face', 'feet', 'finger', 'foot', 'hair', 'hand', 'head', 'heart', 'hip', 'knee', 'leg', 'lip', 'moustache', 'mouth', 'muscle', 'nail', 'neck', 'nose', 'shoulders', 'skin', 'stomach', 'teeth', 'throat', 'thumb', 'toe', 'tongue', 'tooth', 'wrist'],                    
                        ['scroll', 'click', 'copy', 'cut', 'command', 'database', 'delete', 'digital', 'file', 'find', 'font', 'format', 'graphic', 'icon', 'hardware', 'input', 'interactive', 'Internet', 'keyboard', 'menu', 'modem', 'mouse', 'multimedia', 'network', 'printer', 'processing', 'replace', 'save', 'scanner', 'search', 'select', 'software', 'sonic screwdriver'],
                        ['belt', 'blouse', 'boots', 'cap', 'cardigan', 'coat', 'dress', 'gloves', 'hat', 'jacket', 'jeans', 'overalls', 'overcoat', 'pajamas', 'pants', 'raincoat', 'scarf', 'shirt', 'shoes', 'shorts', 'skirt', 'slacks', 'slippers', 'socks', 'stockings', 'suit', 'sweater',  't-shirt', 'tie', 'trousers', 'vest']
                    ];
   
    
    var colors = ['Red', 'Blue', 'Orange', 'Pink', 'Black', 'Yellow', 'Green', 'Purple', 'Brown', 'Magenta', 'Tan', 'Cyan', 'Olive', 'Maroon', 'Navy', 'Aquamarine', 'Turquoise', 'Silver', 'Lime', 'Teal', 'Indigo', 'Violet', 'Pink', 'Black', 'White', 'Gray'];
   
    var wordsToRemember = [];
    var wordsToPickFrom = [];
    var currentCategoryIndex = 0;
    var correctAnswer = '';
    var previousCorrectAnswers = [];
     
    var DEFAULT_WORDS_TO_REMEMBER_LENGTH = 7;
    var DEFAULT_WORDS_TO_PICK_FROM_LENGTH = 3;

module.exports = {

    //Manually push a new category and words associated with that category
    addToDictionary : function (words, category) {
        categories.push(category);
        dictionary.push(words);
    },
    
    //Generate wordsToRemember and wordsToPickFrom through a random category.
    generateWordLists : function (wordsToRememberLength, wordsToPickFromLength) {
        var prevCategoryIndex = currentCategoryIndex;
        
        while (currentCategoryIndex == prevCategoryIndex) {
            currentCategoryIndex = Math.floor(Math.random() * dictionary.length);   
        }
        
        module.exports.populateWordLists(wordsToRememberLength, wordsToPickFromLength);
    },
    
    //Generate wordsToRemember and wordsToPickFrom through a user sepcified category.
    generateWordListsByCategory : function (wordsToRememberLength, wordsToPickFromLength, category) {

        for (var i = 0; i < categories.length; i++) {
            if (categories[i].toUpperCase() == category.toUpperCase()) {
                currentCategoryIndex = i;
                break;
            }
        }
        
        module.exports.populateWordLists(wordsToRememberLength, wordsToPickFromLength);
    },
    
    //Generates both wordsToRemember and wordsToPickFrom based on a specific length
    populateWordLists : function (wordsToRememberLength, wordsToPickFromLength) {
        wordsToRemember = [];
        wordsToPickFrom = [];
        
        var currentWordList = dictionary[currentCategoryIndex];
        
        //Uses default lengths in case of bad inputs
        if (wordsToRememberLength + wordsToPickFromLength > currentWordList.length || wordsToRememberLength <= 0  || wordsToPickFromLength <= 0) {
            wordsToRememberLength = DEFAULT_WORDS_TO_REMEMBER_LENGTH;
            wordsToPickFromLength = DEFAULT_WORDS_TO_PICK_FROM_LENGTH;
        }
        
        //Randomly spliced from currentWordList and is of length wordsToRememberLength
        wordsToRemember = dictionary[currentCategoryIndex].sort(() => .5 - Math.random()).slice(0, wordsToRememberLength); 
        
        module.exports.populateWordsToPickFrom(wordsToPickFromLength);
    },
    
    //Populates the wordsToPickFrom ensuring only one duplicate between lists and repeated common answer.
    populateWordsToPickFrom : function(wordsToPickFromLength) {
        var currentWordList = dictionary[currentCategoryIndex];
        wordsToPickFrom = [];
        
        //Includes only one word from the list of words to remember
        var randomIndex = Math.floor(Math.random() * wordsToRemember.length);
        
        if (correctAnswer != '') {
            while (wordsToRemember[randomIndex] == correctAnswer || previousCorrectAnswers.includes(currentWordList[randomIndex])) {
                randomIndex = Math.floor(Math.random() * wordsToRemember.length);
            }
        }
        
        console.log(wordsToPickFrom);
        
        wordsToPickFrom.push(wordsToRemember[randomIndex]);
        correctAnswer = wordsToRemember[randomIndex];   
        previousCorrectAnswers.push(correctAnswer);
        
        //Populates the rest of the words to pick from with words that do not overlap with the words to remember or previous common words
        while (wordsToPickFrom.length < wordsToPickFromLength) {
            
            randomIndex = Math.floor(Math.random() * currentWordList.length);
            
            if (!wordsToRemember.includes(currentWordList[randomIndex]) && !wordsToPickFrom.includes(currentWordList[randomIndex])) {
                console.log(currentWordList[randomIndex]);
                wordsToPickFrom.push(currentWordList[randomIndex]);
                if (wordsToPickFrom[0] == undefined) {
                    wordsToPickFrom.shift();
                }
            }
        }
        
        
        wordsToPickFrom = wordsToPickFrom.sort(() => .5 - Math.random()); //Shuffles wordsToPickFrom
    },
    
        addColorsToWordList : function(wordList) {
        colors = colors.sort(() => .5 - Math.random()); //Shuffles colors array
        var usedColors = [];
        
        for (var i = 0; i < wordList.length; i++) {
            
            var randomIndex = Math.floor(Math.random() * colors.length);
            
            while (!usedColors.includes(colors[randomIndex])) {
                randomIndex = Math.floor(Math.random() * colors.length);
            }
            
            var currentColor = colors[randomIndex];
            usedColors.push(currentColor);
            
            var word = currentColor + ' ';
            word += wordList[i];
            wordList[i] = word;
        }
        
        return wordList;
    },
    

    getWordsToRemember : function () { 
        return wordsToRemember;
    },

    getWordsToPickFrom : function () {
        return wordsToPickFrom;
    },
    
    getCategories : function () {
        return categories;
    },
    
    getCorrectAnswer : function () {
        return correctAnswer;
    }, 
    
    getPreviousCorrectAnswers : function () {
        return previousCorrectAnswers;
    }

}