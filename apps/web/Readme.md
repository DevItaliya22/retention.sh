insta auto dm

## bija dhandha ma points redeem thava pade

online menu

IMP :

In referal ,expiration , theme and all is not done , points are getting tp both the people , but for points we have to make sure it gets expire after "X" days , so maybe cROn and also a way where we set expiryDate in DB hihv helps to chekc how many points are still remaining

T and C system is also not done yet

Baki:
referal
Loyalty
QR
Feedback
Tier
Membership

analytics

email
sms
whatsapp

gamification
billing
SKU adding

<!--  form https://www.openloyalty.io/  -->

Points
Tiers
Games of chance
Rewards
Wallets
Spin the wheel
Referrals
Achievements
Lotteries
Badges
Leaderboard
Scratch & win

https://www.youtube.com/watch?v=691KWbNnZHM&t=383s

priorituy access , extended window support , personal guidance and services , free dibs on new produscts

https://www.unifynd.com/
https://thriwe.com/
https://squareup.com/us/en
https://www.openloyalty.io/

no suggesyion shoyuld come in inpiuts

we have a x amount of token given to person who regiter themselves , but people can do one thing like regietre and then immeditely make a bill which can make loss , so we should have a "x" amount of days to wait for using yhis point

https://uselayouts.com/docs/components/inline-edit

for feedbaack : https://uselayouts.com/docs/components/multi-step-form

https://uselayouts.com/docs/components/smooth-dropdown

https://uselayouts.com/docs/components/status-button#copy-the-code

how it works section : https://uselayouts.com/docs/components/vertical-tabs

now see there is one mistae we have done

in cashback type if thngs ,we are giving instant cashbacks , measn when the bill is created we give the user instant cashback , but what should rather happen is ,we give them the cashback points which stays in their wallet , and in this transaction they can redeem discount from the prev cashback poitns and , the current bill will generate the cashback according ot that ,

example
10% cashback , min purchase needed to earn = 1000 , min purchade needed to redeem = 2000
, max redeem at one time is 300

now customer coems and buys a water bottle of 20 , he gets 0 cahsback points
now next time he comes and buys things worth of 3000 , so now since 3000 > 1000 so he will earn 10% point on 3000 whih is 300
but this time 3000>2000 but this time only he got the point ,he didnt had prev points so he cant claim any discount

now wallet have 300 points

now next time he comes and buys for 1500 -> 1500>1000 so he can get the points on 10% rate which is 150

walllet = 450

now next time he comes and buys for 4000 , here 4000 > 1000 and 2000

so he can use his prev points from 450 , but since max points were 300 to redeem iin one session , so he will take discount of 300

now bill is at the end 3700 as final bill

now in db we have one mre thing , which is onFinalAmount bool , now if thsj is true then we will calc on 3700 , else we will calc on 4000

now let say it was on -then he gets 370 points extra after the bill is created. but durein he cut 300 also

so 450-300 is done beforeonly
and now we will add this 370 points in wallet

thats how it should work

I’m building a B2B SaaS product that solves the customer retention issue. We’ll achieve this by giving loyalty points, using capmagin (WordPress, Instagram, emails, SMS), QR codes, feedback, and other methods. In today’s volatile market, we’ll encourage customers to frequent our store and make consistent purchases.
