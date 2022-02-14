import { LightningElement,track,wire,api} from 'lwc';
import getAccounts from '@salesforce/apex/AccountHelperControllerTest.searchAccountNameMethod';
import selectOption from '@salesforce/apex/AccountHelperControllerTest.selectedOption';
import selectedOptionindustry from '@salesforce/apex/AccountHelperControllerTest.selectedOptionindustry';
import delAccRecord from '@salesforce/apex/AccountHelperControllerTest.delAccRecord';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import carouselImages from '@salesforce/resourceUrl/carServiceImage';

import insertAccountMethod from '@salesforce/apex/AccountHelperControllerTest.insertAccountMethod';
import accName from '@salesforce/schema/Account.Name';
import accPhone from '@salesforce/schema/Account.Phone';
import accIndustry from '@salesforce/schema/Account.Industry';
import accWebsite from '@salesforce/schema/Account.Website';
import accAnnualRevenue from '@salesforce/schema/Account.AnnualRevenue';
//pdf file here
import getAccountpdf from '@salesforce/apex/AccountHelperControllerTest.getAccountpdfController';
import {loadScript} from "lightning/platformResourceLoader";
import JSPDF from '@salesforce/resourceUrl/jspdf2';
//import { jsPDF } from '@saleforce/jspdf';
import { updateRecord } from 'lightning/uiRecordApi';

import saveMultiAccounts from '@salesforce/apex/AccountHelperControllerTest.createAccounts';
import {deleteRecord} from 'lightning/uiRecordApi';

const DELAY = 100;

const actions = [
    { label: 'View', name: 'view' },
    { label: 'Edit', name: 'edit' },
];
const columns = [

    {
        label: 'View',
        type: 'button-icon',
        initialWidth: 75,
        typeAttributes: {
            iconName: 'action:preview',
            title: 'Preview',
            variant: 'border-filled',
            alternativeText: 'View'
        }
    },   
    { label: 'Id', fieldName: 'Id',sortable: "true"},  
    { label: 'Name',fieldName: 'Name', type: 'url',
     typeAttributes:{
        label:{fieldName:'Name'},
        target:'_blank'} },

{ label: 'Account Name', fieldName: 'accountUrl', type: 'url',
   typeAttributes:{label:{fieldName: 'Name'},target:'_blank'} },

    { label: 'Industry', fieldName: 'Industry',sortable: "true"},
    { label: 'Website', fieldName: 'Website', type: 'url', editable:true,sortable: "true"},
    { label: 'AnnualRevenue', fieldName:'AnnualRevenue',sortable: "true"},
    { label: 'Phone', fieldName: 'Phone',sortable: "true",
    cellAttributes: { 
        iconName: 'utility:phone_portrait' }},

  { label: 'Rating', fieldName: 'rating', type: 'text', cellAttributes:
  { iconName: { fieldName:'accountRatingIcon'}, iconPosition: 'right' }},
  { label: 'Industry_Image', fieldName:'Industry_Image__c',sortable: "true"},
  {type: "button", label: 'Action',typeAttributes: {  
    label: 'Edit',  
    name: 'Edit',  
    title: 'Edit',  
    disabled: false,  
    value: 'edit',  
    iconPosition: 'left'  },},
  
    { type: 'action',
    typeAttributes: { rowActions: actions },
    }

];

export default class DisplayAccountDetails extends NavigationMixin(LightningElement) {
    

    recordTypeId;
    isModalOpen = false;
    @track modalAccountId;
    showSpinner = false;
    @track isTrue = false;
    //@api selectedContactIdList=[];//for combobox
    selectedValue;//for combobox
    @track buttonLabel ='Delete Selected Account';
    @track showLoadingSpinner = false;
    @track columns = columns; 
    @track error;
    @track dataList=[];
     items; 
    @track data = []; 
     
    accountName = '';
    accountPhone = '';
    @api selectedRecords=[];
    //display the total count record
    @track recordsCount = 0;

    @track startingRecord = 1;
    @track endingRecord = 0; 
    @track pageSize = 5; 
    @track totalRecountCount = 0;
    @track totalPage = 0;
    @track page = 1; 
    //@track result;
    @track customFormModal = false; 
    wireAccountsResult;
    
    image1 = carouselImages + '/page-banner-66.jpeg';
    image2 = carouselImages + '/page-banner-80.jpeg';
    
    //adding new account
    @track accountid;
   
    @track getAccountRecord={
        Name:accName,       
        Phone:accPhone,  
        Industry:accIndustry, 
        Website:accWebsite,         
        AnnualRevenue:accAnnualRevenue           
    };   
    //accountId;
   
    @wire(getAccounts,{
        accStrName:'$accountName',
        accStrPhone:'$accountPhone'})

    wireAccounts(result){          //using wire function
    this.wireAccountsResult=result;
        if(result.data){
            this.items=result.data;
            console.log('show all data'+JSON.stringify(this.items));
            this.dataList = this.items;
            let accountList = [];
            this.items.forEach(record => {
            //copy the details in record object to accountObj object
            let accountObj = {...record};
             if(record.Rating === 'Hot'){
               accountObj.accountRatingIcon ="custom:custom1";
             }else if(record.Rating === 'Warm'){
                  accountObj.accountRatingIcon = "custom:custom3";
             }else if(record.Rating === 'Cold'){
                  accountObj.accountRatingIcon = "custom:custom5";
             }else{
                    accountObj.accountRatingIcon = "standard:empty";
             }
              // eslint-disable-next-line dot-notation
              accountObj['accountUrl'] = '/lightning/r/Account/' + record.Id +'/view';
              accountList.push(accountObj);
            });
            this.items = accountList;
            this.dataList=this.items;
            console.log('Display value of accountObj'+JSON.stringify(this.dataList));

            this.showLoadingSpinner = false;
            refreshApex(this.wireAccountsResult);
            this.totalRecord=result.data.length;
            this.totalRecountCount = result.data.length; 
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);  
            this.dataList = this.items.slice(0,this.pageSize); 
            this.endingRecord = this.pageSize;
            //this.columns = columns; 
            this.error = undefined;
            console.log('Display value is: @@@Selected records'+JSON.stringify(this.dataListObj));
         
        }else if(result.error){
            this.error=result.error;
            this.result.data=undefined;
        }
    } 
  
     searchAccountAction(event){
        //this.accountName = event.target.value;
        const searchString = event.target.value;
        window.clearTimeout(this.delayTimeout);
        this.showLoadingSpinner = true;
        this.delayTimeout = setTimeout(() => {
        this.accountName  = searchString; 
        this.showLoadingSpinner = false
        }, DELAY);
        
    }
    
    handleEdit = (event) =>{
           //this.modalAccountId = event.detail.row.Id; 
          //this.modalAccountId = event.target.value;
          this.modalAccountId = event.detail.row.Id;
          console.log('display account id..............' +this.modalAccountId );
          this.isModalOpen = true;
          return refreshApex(this.wireAccountsResult);
         
      }
     handleModalClose = () =>{
          refreshApex(this.dataList);
          this.isModalOpen = false;
          //this.showLoadingSpinner = true
          return refreshApex(this.wireAccountsResult);    
      }
     
      get options() {
        return [
            { label: '5',value: '5' },
            { label: '10',value: '10' },
            { label: '15',value: '15' },
            { label: '20',value: '20' },
         ];

    }

    handleChange(event) {   //combobox select record number
        this.selectedValue = event.detail.value;
        console.log('Selected value is : '+this.selectedValue);
        selectOption({recordSize:this.selectedValue}) // calling the apex method for combobox
              .then(result => {
                  console.log("in success,",result);
                  //this.showSpinner = true;
                  this.dataList = result;  
                  console.log('Dispaly data:::'+this.dataList);
                  //this.error = undefined;
              })
              .catch(error => {
                  this.error = error;
                  this.dataList = undefined;
             });
      }

      getSelectedId(event){
        const selectedRows = event.detail.selectedRows;
        this.recordsCount = event.detail.selectedRows.length;
       // this.isTrue = true;
        for(let i=0; i< selectedRows.length; i++){
            this.selectedRecords.push(selectedRows[i].Id);
            console.log('@@@Selected records'+JSON.stringify(this.selectedRecords));

        }
        
    }

    handleDelete(event){ 
        this.isTrue = true;
        delAccRecord({
            acclist:this.selectedRecords      
           
        })
        .then(()=>{
            const vet = new ShowToastEvent({
                title: 'Delete Record.',
                message :this.recordsCount +' Record is Deleted Successfully......',
                variant : 'success',
            });
            
            this.dispatchEvent(vet);
            this.isTrue = false;
            this.template.querySelector('lightning-datatable').selectedRows=[];
            this.recordsCount = 0;
            return refreshApex(this.wireAccountsResult);
           
        }).catch(error => {
            const vet = new ShowToastEvent({
                title: 'Delete Record.',
                message :'You Cant Delete Record',
                variant : 'warning'
                
            });
            this.dispatchEvent(vet);
            console.log('im here');
            this.errorMessage=error;
            console.log('Error'+JSON.stringify(this.errorMessage));
        });
        
        this.isTrue = false;
        return refreshApex(this.wireAccountsResult);
    }
   //delete card 
    handleDeleteCard(event){ 
        const recordId = event.target.dataset.recordid;
        deleteRecord(recordId)
          .then(()=>{
           this.dispatchEvent(
           new ShowToastEvent({
           title : 'Success',
           message : 'Account Deleted',
           variant : 'success'
       })
     );
        return refreshApex(this.wireAccountsResult);
        })
        .catch((error)=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title : 'Error',
                    message : 'Error Deleting record',
                    variant : 'error'
                })
            );
        });


    }

    //clicking on previous button this method will be called
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //clicking on next button this method will be called
    nextHandler() {
        if((this.page<this.totalPage) && this.page !== this.totalPage){
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);            
        }             
    }

    //this method displays records page by page
    displayRecordPerPage(page){
        this.startingRecord = ((page -1) * this.pageSize) ;
        this.endingRecord = (this.pageSize * page);
        this.endingRecord = (this.endingRecord > this.totalRecountCount) 
                            ? this.totalRecountCount : this.endingRecord; 
        this.dataList = this.items.slice(this.startingRecord, this.endingRecord);
        this.startingRecord = this.startingRecord + 1;
    }    
  
    
    @api recordId;
    // Navigate to New Account Page
    navigateToNewAccountPage() {
     this[NavigationMixin.Navigate]({
         type: 'standard__objectPage',
         attributes: {
             objectApiName: 'Account',
             actionName: 'new'
         },
     });
   }

   customShowModalPopup() {            
      this.customFormModal = true;
    }
   customHideModalPopup() {      
      this.customFormModal = false;
      return refreshApex(this.wireAccountsResult);
   }
   
   nameInpChange(event){
    this.getAccountRecord.Name = event.target.value;
   }
  phoneInpChange(event){
    this.getAccountRecord.Phone = event.target.value;
 }
   industryInpChange(event){
     this.getAccountRecord.Industry = event.target.value;
   }
   websiteInpChange(event){
     this.getAccountRecord.Website = event.target.value;
   }
   annualRevenueInpChange(event){
     this.getAccountRecord.AnnualRevenue = event.target.value;
   }
       
   saveAccountAction(){
    window.console.log('before save' + this.createAccount);
    insertAccountMethod({accountObj:this.getAccountRecord})
    .then(result=>{
      window.console.log(this.createAccount);
        this.getAccountRecord={};
        this.accountid=result.Id;
        window.console.log('after save' + this.accountid);
        
        const toastEvent = new ShowToastEvent({
          title:'Success!',
          message:'Account created successfully',
          variant:'success'
        });
        this.dispatchEvent(toastEvent);
        
    })
    .catch(error=>{
       this.error=error.message;
       window.console.log(this.error);
    });
    return refreshApex(this.wireAccountsResult);  
  }


  validateFields() {
   this.template.querySelectorAll('lightning-input-field').forEach(element => {
       element.reportValidity();
   });
 }
 

/*     PDF Gengrator         */

      AccountpdfList = [];
      headers = this.createHeaders([
                    "Id",
                    "Name",
                    "AnnualRevenue",
                    "Phone",
                    "Website",
                    "Industry"]);
     jsPdfInitialized=false;
     renderedCallback() {
       /* if (this.jsPdfInitialized) {
            return;}
         this.jsPdfInitialized = true;*/
       Promise.all([loadScript(this,JSPDF)]);
     }
    generatePdf(){
       const { jsPDF } = window.jspdf;
       const doc = new jsPDF({  });
        console.log(doc.output('datauristring')); 
        doc.text("Account Details Report " +new Date(), 25,25);
        doc.table(25, 25, this.AccountpdfList, this.headers, { autosize:true }); // cretae table i pass list of account
        doc.save("AccountDetails.pdf");
        console.log(doc.output('datauristring'));
     }

     generateData(){
      //this.showLoadingSpinner = true;
        getAccountpdf().then(result=>{
        this.AccountpdfList = result;
        this.generatePdf();
        console.log('generate');
        console.log(JSON.stringify(this.AccountpdfList))
        //this.showLoadingSpinner = false;
      });
  }

    createHeaders(keys) {
        let result = [];
        for (let i = 0; i < keys.length; i += 1) {
        result.push({
            id: keys[i],
            name: keys[i],
            //phone: keys[i],
            //website: keys[i],
            //industry: keys[i],
            //annualRevenue: keys[i],
            prompt: keys[i],
            width: 38,
            align: "center",
            padding: 0
         });
      }
       return result;
   }

/*inline editing=================== */

draftValues = [] 

 handleSave(event) {
        console.log(event.detail.draftValues)
        const recordInputs = event.detail.draftValues.slice().map(draft=>{
            const fields = Object.assign({}, draft)
            return {fields};
    });
    console.log("recordInputs", recordInputs);
    const promises = recordInputs.map(recordInput => updateRecord(recordInput))
    // eslint-disable-next-line no-unused-vars
    Promise.all(promises).then(Response =>{
        this.showToastMsg('Success', 'Account updated')
        this.draftValues=[]
        return refreshApex(this.wireAccountsResult); 
    
    }).catch(error=>{
     this.showToastMsg('Error creating record', error.body.message, error)
  }) 
     
}

   ShowToastEvent(title,message,variant){
    this.dispatchEvent(
        new ShowToastEvent({
            title:title,
            message:message,
            variant:variant||'success'
        })
    )
  }

 /*  ====================Excel=============*/
   @track DataList = {}
   columnHeader =['Id','Name','AnnualRevenue','Phone','Website','Industry']
   exportAccountData(){
    console.log('Excel button click download'+JSON.stringify(this.dataList));
       // Prepare a html table
       let doc = '<table>';
       // Adding styles for the table
       doc += '<style>';
       doc += 'table, th, td {';
       doc += '    border: 1px solid black;';
       doc += '    border-collapse: collapse;';
       doc += '}';          
       doc += '</style>';
       // Add all the Table Headers
       doc += '<tr>';
       this.columnHeader.forEach(element => {            
           doc += '<th>'+ element +'</th>'           
       });
       doc += '</tr>';
       // Add the data rows from here
       this.dataList.forEach(record => {
           doc += '<tr>';
           doc += '<th>'+record.Id+'</th>'; 
           doc += '<th>'+record.Name+'</th>'; 
           doc += '<th>'+record.AnnualRevenue+'</th>';
           doc += '<th>'+record.Phone+'</th>'; 
           doc += '<th>'+record.Website+'</th>'; 
           doc += '<th>'+record.Industry+'</th>'; 
           doc += '</tr>';
       });
       doc += '</table>';
       let element = 'data:application/vnd.ms-excel,' + encodeURIComponent(doc);
       let downloadElement = document.createElement('a');
       downloadElement.href = element;
       downloadElement.target = '_self';
       downloadElement.download = 'Account Data.xls';
       document.body.appendChild(downloadElement);
       downloadElement.click();
    /*main*/}



    @api
    myRecordId;
    get acceptedFileItem() {
        return ['.pdf', '.png', '.pdf'];
    }
    uploadFiledAction(event) {
        const uploadedFiles = event.detail.files;
        this.uploadedFiles =null;
       // alert("No. of files uploaded : " + uploadedFiles.length);
        const toastEvent = new ShowToastEvent({
            title:'Files uploaded successfully',
            message:'No. of files uploaded ' + uploadedFiles.length,
            variant:'success',
        })
        this.dispatchEvent(toastEvent);
    }
    

   /*======================filter based on industry=========*/
   selectedValues = 'All'; 
   @track records;
   @track selectedOption;

   get options2() {
    return [
        
        { label: 'Apparel', value: 'Apparel' },
        { label: 'Biotechnology', value: 'Biotechnology' },
        { label: 'Construction', value: 'Construction' },
        { label: 'Banking', value: 'Banking' },
        { label: 'Energy', value: 'Energy' },
        { label: 'Chemicals', value: 'Chemicals' },
        { label: 'Education', value: 'Education' }
       
       
    ];
  }
  
  handleChanges( event ) { 
    this.selectedValues = event.detail.value;
    this.showLoadingSpinner = true;
    if(this.selectedValues ==='selectedOption'){
        //this.dataList=this.items;
      
        this.filter();
    }else{
        this.dataList = undefined;
    }
    console.log('@@@Selected records'+JSON.stringify(this.selectedValues));
    console.log("select value display of industry"+this.selectedValues);
    selectedOptionindustry({industrybased:this.selectedValues}) // calling the apex method for
    //if(selectedOptionindustry({industrybased:this.selectedValues==='All'})){
    .then(result => {
        console.log("in success,",result);
        this.showLoadingSpinner = false;
        this.dataList = result;
        console.log('Dispaly data:::'+this.dataList);
        this.error = undefined;    
    })
      .catch(error => {
        this.error = error;
        this.dataList = undefined;
     });

 }
  
 

/*===========================edit view picklist============================*/

handleRowActionss( event) {
    this.isModalOpen = false;
    this.actionName = event.detail.action.name;
    console.log('Display row details'+this.actionName);
    const row = event.detail.row;
    console.log('Display row details'+this.row);
    console.log('Display row details'+this.actionName);
   
    this.isModalOpen = false;
    switch ( this.actionName ) {
        case 'view':
            this.isModalOpen = false;
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id,
                    actionName: 'view'
                    
                }
            });
            break;
        case 'edit':
            this.isModalOpen = false;
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id,
                    objectApiName: 'Account',
                    actionName: 'edit'
                }
            });
            break;
        default:
    }

}

/*======================display modal for show details======================*/
dataRow;
@track accountRow={};
@track rowOffset = 0;  
@track modalContainer = false;
@track oppdata;


   handleRowActions=(event)=>{
         /* this.isModalOpen =false;
          this.dataRow = event.detail.row;
          window.console.log('contactRow## ' + this.dataRow);
          this.accountRow = this.dataRow;
          console.log('Previw details of account opp'+JSON.stringify(this.accountRow));
          this.modalContainer=true;
          //event.event.preventDefault();
          //this.accountId=event.target.dataset.accountId;
          //this.accountId = event.detail;
         // console.log('accountId ' +JSON.stringify(this.accountId));
          //this.oppmodalAccountId = event.detail.row.Id;
          //this.accountidfrmparent = event.detail.row.Id; 
          this.accountId = event.detail.value;
          console.log('accountid..............' +JSON.stringify(this.accountId));  
          console.log('modal id..............' +this.accountidfrmparent);
         /* const myCustomEventItem = new CustomEvent('myevent',{
            detail:this.accountidfrmparent
            
         });
         this.dispatchEvent(myCustomEventItem);
         this.isModalOpen = true;*/
    }

    closeModalAction(){
    this.modalContainer=false;
   }
   
   /*handlecall(){
       var childcompVar = this.template.querySelector('c-opportunity-list');
       var sendParam = {'firstName':'Habib'};
       childcompVar.testChildMethod(sendParam);
       console.log('call method call');
   }*/
 /*=========adding row  name account=========*/

 
 
 showDetails=false;
 actionButtonLabel ='Add New Account';

handleChangesshow =() =>{
this.showDetails=!this.showDetails;
this.actionButtonLabel = this.showDetails ? 'Close Tab' :'Add New Account';
console.log(this.showDetails);

}

@track keyIndex = 0;  
@track message;  
@track MultiplerecordsCount = 0;
@track accountRecList =[
    {
        Name: '',
        Industry: '',
        Phone:''

    }
];

changeHandler(event){ 
    if(event.target.name==='accName')
            this.accountRecList[event.target.accessKey].Name = event.target.value;
        else if(event.target.name==='accIndustry'){
            this.accountRecList[event.target.accessKey].Industry = event.target.value;
        }
        else if(event.target.name==='accPhone'){
            this.accountRecList[event.target.accessKey].Phone = event.target.value;
        }

}

addRow() {
    this.keyIndex+1;   
    this.accountRecList.push ({            
        Name: '',
        Industry: '',
        Phone: ''
    });
    console.log('Enter ',this.accountRecList);
    console.log('Enter ',this.accountRecList);
  

}

 //Save Accounts
 saveMultipleAccount() {
    console.log("accountlist"+JSON.stringify(this.accountRecList));
    saveMultiAccounts({ accountList : this.accountRecList })
      .then(result => {
       this.message = result;
       this.error = undefined;      
       //this.MultiplerecordsCount = this.result.length;          
       this.accountRecList.forEach(function(item){                   
       item.Name='';
       item.Industry='';
       item.Phone='';                   
    });

    //this.accountRecList = [];
    if(this.message !== undefined) {
      this.dispatchEvent(
      new ShowToastEvent({
        title: 'Success',
        message: 'Accounts Created!',
        //message :this.MultiplerecordsCount +'  Record is Created Successfully......',
        variant: 'success',
                }),
            );
         }
                
         console.log(JSON.stringify(result));
         console.log("result", this.message);
    })
     .catch(error => {
        this.message = undefined;
        this.error = error;
        this.dispatchEvent(
        new ShowToastEvent({
        title: 'Error creating records',
         message: error.body.message,
         variant: 'error',
        }),
     );
     console.log("error", JSON.stringify(this.error));
 });


 }


 removeRow(event){ 
    if(this.accountRecList.length>=1){             
        this.accountRecList.splice(event.target.accessKey,1); // identify which row remove
        this.keyIndex-1;
   }
 }

}//main close

