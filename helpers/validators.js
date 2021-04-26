const isValidDate = ((inputDate) => {
    return inputDate instanceof Date && !isNaN(inputDate);
})

const isValidNumber = ((inputNumber) => {
    return !isNaN(inputNumber);
})

const isValidSortingDirection = ((inputDirection) => {
    return (inputDirection === 'asc' || inputDirection === 'desc'); 
})

module.exports = {
    isValidDate,
    isValidNumber,
    isValidSortingDirection   
};