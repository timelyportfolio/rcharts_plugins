setwd("C:/Users/Kent.TLEAVELL_NT/Dropbox/development/r/rcharts_plugins")
source("plugins.R")

#example 1 from http://mostlyconjecture.com/2014/06/30/linear-models-with-rcharts-and-d3/

library(foreign)
#library(RJSONIO) think rjson will be faster and work with no change
library(rjson)
library(magrittr)

#rm(list = ls())

polls <- read.dta('http://www.stat.columbia.edu/~gelman/arm/examples/election88/polls.dta')

make_factors <- function(d, min = 20) {
  facs <- which(sapply(d, function(x) length(unique(x)) < min))
  d[facs] <- lapply(d[facs], factor)
  d
}
polls <- make_factors(polls)
polls <- polls[complete.cases(polls),]
polls$state <- factor(polls$state)
formulas <- list(m1='bush ~ black + female',
                 m2 = "bush ~ black + female + edu + age",
                 m3 = "bush ~ black + female + edu + age + year")
models <- lapply(formulas, function(x) {
  glm(x, data = polls, family = binomial)
})
coefs <- lapply(models, function(x) {
  cf <- as.data.frame(summary(x)$coef)
  cf$variable <- row.names(cf)
  cf
})

fits <- as.data.frame(lapply(models, fitted))
names(fits) <- paste0('fit_', names(fits))
polls <- cbind(polls, fits)
rm(fits)
res <- as.data.frame(lapply(models, resid))
names(res) <- paste0('resid_', names(res))
polls <- cbind(polls, res)
rm(res)
ch <- PlotLM$new()
# you're welcome to wait for the whole dataset to load, but it takes a while
ch$set(data = polls[sample(nrow(polls), 800), ], coefs = coefs,
       formulas = formulas, prediction_lines = 3, coef_barheight = 30
)
ch


#example 2 from http://mostlyconjecture.com/2014/06/30/linear-models-with-rcharts-and-d3/
d <- read.csv('http://www.stat.columbia.edu/~gelman/arm/examples/beauty/ProfEvaltnsBeautyPublic.csv')
d$female <- factor(d$female)
factors <- c(1:3, 18:47, 50:56, 60,61)
d[,factors] <- lapply(d[,factors], factor)
d <- d[,-grep('class', names(d))]
formulas <- list(
  m1 = 'profevaluation ~ age + female + courseevaluation + minority + btystdvariance',
  m2 = 'profevaluation ~ age + female + courseevaluation + tenured',
  m3 = 'tenured ~ age + female + courseevaluation + profevaluation')
models <- lapply(formulas[1:2], glm, data=d)
models[['m3']] <- glm(formulas[[3]], data=d, family='binomial')
lapply(models, summary)
coefs <- lapply(models, function(x) {
  d = as.data.frame(summary(x)$coef)
  d$variable <- row.names(d)
  d
})
fits <- as.data.frame(lapply(models, fitted))
names(fits) <- paste0('fit_', names(fits))
d <- cbind(d, fits)
rm(fits)
res <- as.data.frame(lapply(models, resid))
names(res) <- paste0('resid_', names(res))
d <- cbind(d, res)
rm(res)

ch <- PlotLM$new()
ch$set(data = d, coefs = coefs, coef_barheight = 15,
       formulas = formulas, prediction_lines = 5
)
ch

#examples not from http://mostlyconjecture.com/2014/06/30/linear-models-with-rcharts-and-d3/
#using glm documentation

utils::data(anorexia, package = "MASS")

formula <- "Postwt ~ Prewt + Treat + offset(Prewt)"

anorexia %>%
  glm(
    formula = formula,
    family = gaussian,
    data = .
  ) -> model

model %>%
  fitted %>%
  as.data.frame %>%
  set_colnames ("fits") %>% 
  cbind(anorexia,.) -> anorexia

model %>%
  resid %>%
  as.data.frame %>%
  set_colnames ("res") %>% 
  cbind(anorexia,.) -> anorexia

ch <- PlotLM$new()

ch %T>%
  .$set(
    data = anorexia
    , coefs = list(
       model1 = 
         model %>% summary %>% .$coef %>% as.data.frame %>% cbind(.,variable=rownames(.)) %>% as.list
    )
    , coef_barheight = 15
    , formulas = list( model1 = formula )
    , prediction_lines = 5
  ) %>% show

# try to make a function to make this a little easier
plotGLM <- function( data, formulas ){
  require(magrittr)
  
  1:(length(formulas)) %>%
    lapply(
      FUN=function(n){
        glm(
          formula = formulas[[n]]$formula
          ,family = formulas[[n]]$family
          ,data = data
        )
      }
    ) %>%
    set_names(names(formulas)) -> models
  
  
  1:length(models) %>%
    lapply(
      FUN = function(n){
        models[[n]] %>% 
          fitted %>%
          as.data.frame %>%
          return
      }
    ) %>%
    do.call(cbind,.) %>%
    set_colnames (paste0("fits_",names(models))) %>% 
    cbind(data,.) -> data  
    
  1:length(models) %>%
    lapply(
      FUN = function(n){
        models[[n]] %>% 
          resid %>%
          as.data.frame %>%
          return
      }
    ) %>%
    do.call(cbind,.) %>%
    set_colnames (paste0("resid_",names(models))) %>% 
    cbind(data,.) -> data
  
  models %>%
    lapply(
      FUN = function(model){
        model %>% summary %>% .$coef %>% as.data.frame %>% cbind(.,variable=rownames(.)) %>% as.list
      }
    ) -> coefs
    
  ch <- PlotLM$new()
  
  ch %T>%
    .$set(
      data = data
      , coefs = coefs
      , coef_barheight = 15
      , formulas = formulas %>% lapply(function(f)return(f$formula))
      , prediction_lines = 5
    ) %>% show
  
  return(invisible(ch))
}

# redo example 2 with our new function
d <- read.csv('http://www.stat.columbia.edu/~gelman/arm/examples/beauty/ProfEvaltnsBeautyPublic.csv')
d$female <- factor(d$female)
factors <- c(1:3, 18:47, 50:56, 60,61)
d[,factors] <- lapply(d[,factors], factor)
d <- d[,-grep('class', names(d))]

formulas <- list(
  m1 = 'profevaluation ~ age + female + courseevaluation + minority + btystdvariance',
  m2 = 'profevaluation ~ age + female + courseevaluation + tenured',
  m3 = 'tenured ~ age + female + courseevaluation + profevaluation')

formulas %<>%
  lapply(
    FUN=function(f){
      return(list(formula = f, family="gaussian"))
    }
  )
formulas[[3]]$family = "binomial"

plotGLM(data=d,formulas=formulas)


# redo example 1 with our new function
polls <- read.dta('http://www.stat.columbia.edu/~gelman/arm/examples/election88/polls.dta')

make_factors <- function(d, min = 20) {
  facs <- which(sapply(d, function(x) length(unique(x)) < min))
  d[facs] <- lapply(d[facs], factor)
  d
}
polls <- make_factors(polls)
polls <- polls[complete.cases(polls),]
polls$state <- factor(polls$state)
formulas <- list(m1='bush ~ black + female',
                 m2 = "bush ~ black + female + edu + age",
                 m3 = "bush ~ black + female + edu + age + year")
formulas %<>% 
  lapply(
    FUN=function(f){
      return(list(formula = f, family="binomial"))
    }
  )

polls[sample(nrow(polls), 2000), ] %>% plotGLM( formulas = formulas )
