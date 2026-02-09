We have to chnage the loyalty schema completely

now we will have 4 options for loyaty

1. Cashback
2. Tier / gamified
3. Amount Spent ( in that bill )
4. Visit made

now customer will choose 1 from any of this , now the other fields will be filled according to that

there are some common fields which will be there in every loaylty
which are

1. branding
2. T and c array
   3 . reminder and expiry ( this will be in days like this @packages/prisma/prisma/models/loyalty.prisma:26-29 )
3. @packages/prisma/prisma/models/loyalty.prisma:30-35 channel to send message
4. Ponts name ( which we will use from global bussines field , means we have a business model where we have this so not needed here ) (!! not needed in schema )

6) bonus cookie for copleting user profile ? bool and amount

now non common fields for each

1. Basic -> how this works is when user comes and make a bill then we give direct cashback to that bill ( means discount ) on that bill direclty , so here technically no point system is there rather it is a diff name for discount and this applies on the same bill itself , means if bill is created of 1000 and 10% is cashback then bill will still be created of 1000 but 100 will be shown as cashback and 900 will be the shown as amount in bill list or /bill/id pages etc in admin panel

now fields are
a) how much max cashback customer can earn ? Its a cap amount above which customer cannot earn in this bill , let say cap is 1000 then if bill of 11k at 10% cashback is created then aslo it will give 1k cashback only not 1.1k
b) onFinalAmount ( bool ) -> this means will we give cashback on final amount or the subtotal amount -> means item1-100 , item2-500 , then subtotoal is 600 -> 60 cashback at 10% , but now let say we reducs a discount of 100 due to store offer and not software offer and then add tax and chnarged of 50 -> so total is 550 then this is final amount so cahback will be 55
c) min purchase amount for earning
d) min purchase for redemption
this are the fields for basic

now 2) Tier based or gamification based -> here overall lifetime sum of users bill is considered as loyalty stage upgrades asuser bills more time multiple time ect

here fields will be
a) min purchase for earning
b) also one for redemption
c) max cashback a cust5omer can get ( this option is here because some stires take very bgi orders like party and all so thats why we have a upper limit cap )
d) config stage -> here there will be multiple fields in this too cause this is TIER based -> @packages/prisma/prisma/models/loyalty.prisma:48-73 we have thsi thing , this is corect but we have to make some modification so we can discard this thing if we want as we are making the whole loyalty thing from scratch propely
what it should have is reward teir name , customer life time spendinf range ( a to b ) , customer earns % cashback so float for this , Minimum purchase for earning cashback
, Maximum cashback a customer can earn
if not told inthis , 1 rupper spent = "x" points ,

then 3rd is amoount spent -> let me explain you how ti works , it wokrs like if customer comes and make a bill of let say 1000 and in the loyalty we have something lie bill is <= 1000 then he gtets something (somethig will be configured bottom ) then he gets that thing , but this is for this bill only , make sure we dont think that amount spent is for overall totoal of lifetime spent of user , !!!! no hthta is not the case , this si strcilty for the amount spent in this particular session or bill i mean , overall spent was tracked on above version of gamification

here 1 rupper spent = "x" points , points on subtotl or full amount bool , ma xpoint person can earn in single purchase , then again here also configuration stage , this image will be hepl @image.png @image copy.png

now this config stage in amount spent is diff than above ofc , here admin will put X amount of points needed to get reward -> now what can be rewards ?
3 types of reward in ths section -> free item ,x % discount , x cash discount ,
then for item we will list the SKU if any , if not then will give a "string" input , also we wills troe the name of the SKu as staic no relation needed so anyways a string will come for free item name , then for discount and cash we will have fields for amount and preentage , min purchase req here also ofc , and max too , also add a reward name to show

then comes 4th visit made
here we gives rewards on the basis of visit made , here reawrd are exact same as 3rd like % ,cash , FREE_ITEM , and reward name to show , min ,max things , 1 visit - x points thing

one fild is added here whc us "visit interval", this can be in "min,hr,day,week,month" and number aside it will be diffrent for diff selection like for min 1-60 , hr 1-23 idk you know how it should work right , and a toggle fo it too , if on then only backend checks this part

so this is the thing we have to builf , now see we might need to chnage many things in schema for billing etc too
@packages/prisma/prisma/models/loyalty.prisma:74-147 liek this might needed to be chnages for the track record we can do something better as we are changing the flow and all , so first we will only under what should we do , you will check all this prisma files and understand and make a end to end prisma model in PLAN.md file first the i will review and then we wil proceed , aso what i want is we will list all the common things on top then 1/ 2.,3,4 specfifc , there can be common in same too but we will see what to do , we can make a neew model for 3rd and 4th reward type thing m, one modal fr tier

@packages/prisma/prisma/models

now we will have to chnage all the things , like the api , the UI and all the things which is alreayd been created , so I suggest we should start with making the FORM correct , then we will move forward to make the tables and STUFF to look great then we will move forward to make the billing api and all proper

now for the form ,we have 2 forms for loyalty

one is multi step form anf one is simple setting form ,

we will chnage both of them in on go only

now in multi step form , how the steps should go is like
first take the main thing in the first step we will ask the admin that what he waana do , like this are 4 options to set up loyalty , which option will he chose , it wont be dropdown but rtaher a radio button thing type of selection as it is only 4

and in the same page below each radio button will be small summary with collablae thing , means radio button is there and in the same ie a colapse on off button is there on right , if on the show the summary , dont write "summary" word in ui, not needed

and we will also shoe that once the type is slected it is not possible to chnage it once the loyalty is created ,

now once he sleect , the next steps will be configured accordingy , means diff opions will have diff conseunces of form

next step will be main config of the form
for each section , but one thing we have to take care , ir we will make compoennt diff for each step , so like in 3rd and 4th type amount spent and visit made ,we have common reward system , so that can be single compoen right , same with branding anf all that kinda
i would say branding , expiry then channel can be globably single compoent , means not only for loyalty but diff too , so make them like in common or something if u feel it is rleevant

once this is done you will ofc make a hook for api calling , anf this al done api should be called to sae the onboarding part of loyalty

now see if loyalty onboarding is done already then we will show the setting field form , so then we will show the relevant sections only , means ofc you under stand that what is rleevant for which setion kinda right ?
and one thing for tier and all they should have like admin can create as many sectio as they want by clicking on add section , also in reward in amount spent and 4th visitr made , alos make diff component for things like min piurchase on reddem and eaening and al that thing if u think that is also common in many parts , component steps , we can make upto 6-7-8-9 steps as per need , but make sensibly

and also make sure ot chec types and all the things

==============
now a big chnage we have to do in bil creaion ,

right now in bill creation we are doing too much , like listing down and adding so many info but now we wanna reduce it to bill number , amount , mobile number , name enough no city and all that shit , no email ,

line items and notes let it be but make a colla[sible , there we will have tis line items and notes

@packages/prisma/prisma/models/bill.prisma:40-41 optional in collasible , @packages/prisma/prisma/models/bill.prisma:34-36 needed , so what will hapen is bill number then number then name , amount , store discount, finalAmount ,

now once this is done , until all this is happening we will fetch the info about the loyaty

now since loyatly can be of 4 types , so we take care about that things in bill creaiton api alreayd , but we have to fetch also that what user can get right now in this one too

so what we will do

if the loyaty is of type cashback or tier , then we wont sho anything , we will just show a line before billing that user will bget cahsbak automatically after bill creation

now once this is done the bill will bre created , now if onFinalampout is true then that apply % on that logic else on subtotal and do the thing and we i think send the response back about how much did they got cashback , so we will show in UI that this amount you got cashback in tyhis bill ( also we will add record and all ) i think all this is alreayd doe. in bill creatio but check

now for tier based , we check current tier of the user and then apply onfina amountanf all condotions like miin req nd max cahback an all the stuf and finally gives cashback amount in res and all , and if the user gets upgrade in tier then also we will show that you are upgraded to next tier and now you will reciedce x % or whatevrr from off next time

and add records here also

now for the 3rd type amount spent
then it has psecial reward type and all , that logic is ther i think in code if its not there do it and send spropirate res and mske records and all , same with the 4th one , per visit they get poitns and points are used to redeem

now main thing in 3rd and 4th is before the bill is created , we will still have the ill in context so something , now once the bil is created we will show that this GUY can get this OFF / freeitem while paying , means let say he have "% cashback" then he we show the amount andf all th stuff we do, id ont think context is needed as we depends on the response only , and if notnhing i there then we sohw why nothing an fnothign is given and all...

now one more thing right now we dont any UI execpt the table in user / customer side

so now we will have table for txn and if they get freeitem and all they can see that all things too , and if they are in TIER based then they see the TIER and how much left for the next tiers and all the UI stuff , make good UI , and if VISIT made is then then also we will show how many visit you have made so far and how many you will have to make to get into next ZONE of reward type , @packages/prisma/prisma/models/loyalty.prisma:316-318 this is the thing we crave that this is the amount of points req for netx , for currnt , next next and all///
we show entire chart kinda thing, not chart but something like where he can see where he is oike progres bar but in a good way
