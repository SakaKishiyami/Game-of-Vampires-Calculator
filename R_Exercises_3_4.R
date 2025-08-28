# 1. create a new variable called my.num that contains 6 numbers of your choice
my.num <- c(2, 5, 8, 12, 15, 20)
my.num

# 2. multiply my.num by 4
my.num * 4

# 3. create a second variable called my.char that contains 5 character strings of your choices
my.char <- c("apple", "banana", "cherry", "date", "elderberry")
my.char

# 4. combine the two variables my.num and my.char into a variable called both
both <- c(my.num, my.char)
both

# 5. what is the length of both?
length(both)

# 6. what class is both?
class(both)

# 7. divide both by 3, what happens?
both / 3

# 8. create a vector with elements 1 2 3 4 5 6 and call it x
x <- c(1, 2, 3, 4, 5, 6)
x

# 9. create another vector with elements 10 20 30 40 50 and call it y
y <- c(10, 20, 30, 40, 50)
y

# 10. what happens if you try to add x and y together? why?
x + y

# 11. append the value 60 onto the vector y (hint: you can use the c() function)
y <- c(y, 60)
y

# 12. add x and y together
x + y

# 13. multiply x and y together. pay attention to how R performs operations on vectors of the same length.
x * y