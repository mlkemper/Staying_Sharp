
var CHUNK_LENGTH_INITAL=4;
var CHUNK_LENGTH= 4;
var currentRandomNumber = 0;

module.exports = {

    getRandomNumber : function (CHUNK_LENGTH) {
        var min = Math.pow(10, CHUNK_LENGTH - 1);
        var max = 9 * Math.pow(10, CHUNK_LENGTH - 1);
        
        currentRandomNumber = Math.floor(Math.random() * max) + min;
        
        while (currentRandomNumber == 0 || module.exports.hasRepeatingDigits(currentRandomNumber)) {
            currentRandomNumber = Math.floor(Math.random() * max) + min;
        }
        console.log(currentRandomNumber);
        
        return currentRandomNumber;
    },
    
    //https://stackoverflow.com/questions/42504529/check-number-for-repeated-digits
    hasRepeatingDigits : function (N) {
        return (/([0-9]).*?\1/).test(N)
    }, 
    
    getCurrentRandomNumber : function() {
        return currentRandomNumber;
    } 
    
}