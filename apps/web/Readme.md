insta auto dm

referal

online menu

cashier should be unique only in the busines with the email of slug of business

sub category in categories

cat3gpory order pre filled

check only active SKU should come in BILLinh

colour sky

#REFERAL prompt
now we will hae to do one thing , we havw to add the referal system in our code in business SIDe

so what we will do i will tell you steo by step

First in the setting->general we will add this option of @dy/packages/prisma/prisma/models/business.prisma:10-12 which will use the same settingfield compone t(you will understand what is that )

then we wil make a new page in sidebar + route-metadata + proxy.ts in ubsiness protected route

we willuse @dy/apps/web/src/lib/auth/middleware.ts for auth in server side routes files and make sure no data is eaded any ways

The in the referal client page you will create. a multi step form

now STEP 1 :
how ig works step

here we will show them this
"Firstly, your customers get a referral message after their purchase ( right now we dont have message sending system )"

chnage words how you like

then say this They'll then receive a personal referral sharing page
this will be there every customer will get.a personalised page for themselves
which willhave the image thing

then
@dy/packages/prisma/prisma/models/customer.prisma:35-49 referalslug

now link will be /referal/busises-slug/referal-slug of this user
now let say this is know as page 1 , this page will become identity of the user , we will show the offer that what your frnd get ad what you get a link SHARE with FRIEND

now let say this is link 2 whihc will look like /referal/something meaning full stattic name here/referal-slug
you will tell me before startig that what should we put there

now this link will beofc on share button so user can sopy that and share button wil ofc do navigator.share thing with this link

now when frnd open this link then he will see 2 things phoneNumber and name

now when he clicks continue then the user will be regiterd as new customer in businessCusomer table and all the yhing of making a new customer , we start from making user so check that

like see we first make user then make them customer in this business @dy/packages/prisma/prisma/models/customer.prisma:26-46

right now no OTP erification is needed , might be in future

and once this guy is regitered we will also do referal logs @dy/packages/prisma/prisma/models/customer.prisma:46-48 of this particuar person @dy/packages/prisma/prisma/models/customer.prisma:38-43 thing in new user and add a businescustomer in @dy/packages/prisma/prisma/models/customer.prisma:43-46 in the refrer person

@dy/packages/prisma/prisma/models/referral.prisma this is referal log thing

Also we will have success page of the referd user to show that he recieved that reward
now before all this I forgot one thign to do , we haveto make a new referalB2b or something like that table we have to make and store this @dy/packages/prisma/prisma/models/business.prisma:13-17 in there

we have to give this options like this @dy/packages/prisma/prisma/models/enums.prisma:28-33 which i have added now

now this tpye is only valid for the new customer , then we wlill have reward expires in , send reminder to customer , How can customers know more about you?
section ( array ) @dy/packages/prisma/prisma/models/enums.prisma:54-60 like this same to same like this @dy/packages/prisma/prisma/models/branding.prisma and this branding , T and C @dy/packages/prisma/prisma/models/terms.prisma

all this will come in db and this will be the STEP 1 also while making the form

ow step 2
Existing customers will get sytep

here only have free item and $ discount ( or money discout )

and T and C here also this will be diff T and C

and then a reiew step

so basically short down thing is

we have to make new table with this nrw fileds , and attach it with business for schema ( ths will be the backbone of how it wikl look and all the deatils of the referal )

thn we will have to make a multi step form ( we have compoent  
@dy/packages/ui/src/components/linear-multi-step-form @dy/apps/web/src/components/forms
then we will make

a outside non auth page for USER in new dir ( know as (customer)
which woll be open , means no auth is req to see this so make sure we take care of proxy that way
then here we will have /referal/busonesslug/customer-referal-slug
whihc will be page tp shoiw customer that plz share beow link and this page will av the details from the referal thing

and a page for /referal/claim/customer-referal-slug

here a form with phonenumber ad name

now if the customr is alreayd regierted in businesscustomer table then we wil show failed page with this reason , else if the customer is there in USER table but not in businesscustomer then we will show success pga by creating and filling proper referal and all info along with log on other side
and if user is not even there so we will make new customer role user and add it in businescustomer table and show succcess [age
