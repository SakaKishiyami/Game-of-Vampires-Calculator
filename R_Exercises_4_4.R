# 1. Read in the Youth Tobacco study data and name it youth
youth <- read.csv("Youth_Tobacco_Survey__YTS__Data.csv", header = TRUE)
head(youth, 3)
class(youth)
dim(youth)

# 2. Install and invoke the readxl package
install.packages("readxl")
library(readxl)

# 3. Download an Excel version of the Superstore dataset from Blackboard. Use the read_excel() function in the readxl package to read in the dataset and call the output super.
super <- read_excel("Superstore.xlsx")

# (a) What types of variables are in the dataset? (numeric, text, yes/no)
str(super)
sapply(super, class)

# (b) How many rows and columns are there?
nrow(super)
ncol(super)
dim(super)

# (c) What are the basic statistics for each variable? (mean, min, max, counts)
summary(super)

# (d) Are there any missing values?
sum(is.na(super))
colSums(is.na(super))

# (e) How many unique values are in each variable?
sapply(super, function(x) length(unique(x)))

# 4. Write out the super R object as a CSV file using write.csv() and call the file "superstore.csv"
write.csv(super, file = "superstore.csv", row.names = FALSE)