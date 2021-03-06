import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableHighlight, ScrollView, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import t from 'tcomb-form-native'
import { PressableIcon } from "../../../Components/PressableIcon";
import store from "../../../Redux/store"
import {updateContact, getContact} from "../../../Redux/actions";
import Expo from 'expo';
import {Icons} from "../../../Constants/Icon";
import {ButtonGroup} from 'react-native-elements';

import {AppColors, TabStyles, themeStyles} from "../../../Styles/TabStyles";
import {updateDatabase, updateDatabaseArgument, readDatabaseArg} from "../../../Util/DatabaseHelper";
import {DbTableNames, UsageFunctionIds} from "../../../Constants/Constants";
import {latestSafetyPlanItem} from "../../../Util/Usage";
import {CheckBox} from "../../../Components/Checkbox";

const Form = t.form.Form;

const contact = t.struct({
    firstName: t.String,
    surname: t.maybe(t.String),
    phone: t.String,
    email: t.maybe(t.String),
    helper: t.Boolean,
    responsibility: t.maybe(t.String)
});
// data structure for values to be capture in form below

export default class NewContact extends React.Component {
    static navigationOptions = {
        title: "New Contact"
    };

    constructor(props) {
        super(props);

        this.state = {
            value: null,
            selectedMediaUri: "",
            selectedMediaName: "",
            type: 0,
            options: {
                fields: {
                    firstName: {
                        placeholder: 'First Name',
                        auto: 'none'
                    },
                    surname: {
                        placeholder: 'Surname',
                        auto: 'none'
                    },
                    phone: {
                        placeholder: 'Phone',
                        auto: 'none',
                        keyboardType: 'numeric'
                    },
                    email: {
                        placeholder: 'Email',
                        auto: 'none',
                        autoCapitalize: 'none'
                    },
                    helper: {
                        label: 'Helper',
                        template: CheckBox
                    },
                    responsibility: {
                        placeholder: 'How they can help me',
                        auto: 'none',
                        hidden: true
                    },
                }
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        const checkedContact = nextProps.navigation.getParam('checkedContact', null);

        if(checkedContact !== this.props.navigation.getParam('checkedContact', null)) {
            if (checkedContact !== null) {
                this.setState({
                    value: {
                        firstName: checkedContact.firstName,
                        surname: checkedContact.surname,
                        email: checkedContact.email,
                        phone: checkedContact.phone
                    }
                })
            } else {
                console.log("no contact selected");
            }
        }
    }
    // listen for new props coming from phone contacts screen and update accordingly

    updateType = selectedIndex => {
        this.setState({type: selectedIndex})
    };
    // for updating contact type button group

    onChange = (value) => {
        this.setState({ value: value }, () => {
            this.setState({options: {fields: {...this.state.options.fields, responsibility: {...this.state.options.fields.responsibility, hidden: !this.state.value.helper}}}})
        })
    };

    updateContactList = (contact) => {
        store.dispatch(updateContact(contact));
        // dispatching new contact to global redux store
    };

    refreshDb = func => {
        readDatabaseArg("*", DbTableNames.contact, func, () => console.log("DB read success"), 'where dateDeleted is NULL');
    };
    // for refreshing global state from Contact table in DB

    updateGlobalContacts = (contacts) => store.dispatch(getContact(contacts));

    checkMediaSelected = (contactId) => {
        if(this.state.selectedMediaUri !== "") {
            this.updateDBMedia(contactId)
        }

        this.updateFunctionUsage(contactId.insertId);
        // keeping track of new contact entries for 'my stats'

        this.refreshDb(this.updateGlobalContacts);
    };
    // if media was selected -> update that row with path

    updateFunctionUsage = (contactId) => {
        const name = this.state.value.surname ? this.state.value.firstName + " " + this.state.value.surname : this.state.value.firstName;

        latestSafetyPlanItem(UsageFunctionIds.lastEntered.contact, contactId, name)
    };

    updateDBMedia = contactId => {

        const mediaDirectory = 'SafetyplanMedia/';

        updateDatabaseArgument(DbTableNames.contact,
            [Expo.FileSystem.documentDirectory + mediaDirectory + this.state.selectedMediaName],
            ['image'],
            'where contactId = ' + contactId.insertId,
        );

        Expo.FileSystem.moveAsync(
            {
                from: this.state.selectedMediaUri,
                to: Expo.FileSystem.documentDirectory + mediaDirectory + this.state.selectedMediaName
            }
        )
    };
    // update selected row with media path and copy file from cache to permanent directory

    takePhoto = () => {
        Expo.Permissions.askAsync(Expo.Permissions.CAMERA)
            .then(response => {
                if (response.status !== "granted") {
                    console.log("Camera permission not granted!");
                    return;
                }

                Expo.ImagePicker.launchCameraAsync()
                    .then(mediaShot => {
                        console.log(mediaShot);

                        if(!mediaShot.cancelled) {
                            const splitName = mediaShot.uri.split('/');
                            const shortName = splitName[splitName.length - 1];

                            this.setState(
                                {
                                    selectedMediaUri: mediaShot.uri,
                                    selectedMediaName: shortName,
                                });
                        }
                    })
            })
    };
    // sets the state based on the media item that is taken via camera

    captureMedia = () => {
        Expo.Permissions.askAsync(Expo.Permissions.CAMERA_ROLL)
            .then(response => {
                if (response.status !== "granted") {
                    console.error("Camera roll permission not granted!");
                    return;
                }

                Expo.ImagePicker.launchImageLibraryAsync({mediaTypes: Expo.ImagePicker.MediaTypeOptions.Images})
                    .then(selectedMedia => {
                        console.log(selectedMedia);

                        if(!selectedMedia.cancelled) {
                            const splitName = selectedMedia.uri.split('/');
                            const shortName = splitName[splitName.length - 1];

                            this.setState(
                                {
                                    selectedMediaUri: selectedMedia.uri,
                                    selectedMediaName: shortName,
                                });
                        }
                    })
            })
    };
    // sets the state based on the media item that is selected

    onPress = () => {
        const value = this.refs.form.getValue();
        // returns values captured in form as object

        if (value) { // if validation fails, value will be null
            const updateValue = {...value, helper: parseInt((value.helper ? 1 : 0))} ;

            updateDatabase(DbTableNames.contact, [...Object.values(updateValue), (this.state.type === 0 ? 'Personal' : 'Professional'), ],
                [...Object.keys(updateValue), 'contactType'], this.updateContactList({...updateValue, contactType: (this.state.type === 0 ? 'Personal' : 'Professional')}), this.checkMediaSelected);
            // write the saved values to DB if valid

            this.props.navigation.pop();
            // pop to contact list once saved
        }
    };

    getPhoneContacts = () => {
        Expo.Permissions.askAsync(Expo.Permissions.CONTACTS)
            .then(response => {
                if (response.status !== "granted") {
                    console.error("Contacts permission not granted!");
                    return;
                }

                Expo.Contacts.getContactsAsync({fields: [Expo.Contacts.PHONE_NUMBERS,
                    Expo.Contacts.EMAILS], pageSize: 10000})
                    .then(res => {
                        this.props.navigation.push('phoneContacts', {contacts: res.data})
                    })
                    .catch(err => console.log(err))
            })
    };
    // media that retrieves all (providing less than 10000 contacts!) contacts from phones directory

    render() {
        const buttons = ['Personal', 'Professional'];
        const selectedType = this.state.type;

        return(
            <ScrollView contentContainerstyle={[TabStyles.planContainer, {justifyContent: 'space-evenly'}]}>
                <KeyboardAvoidingView style={{flex: 1}} behavior={'padding'}>
                    <View style={contactStyle.formContainer}>
                        <Form
                            ref="form"
                            type={contact}
                            value={this.state.value}
                            onChange={this.onChange}
                            options={this.state.options}
                        />
                        <ButtonGroup
                            onPress={this.updateType}
                            selectedIndex={selectedType}
                            buttons={buttons}
                            containerStyle={{height: 36, marginBottom: 20}}
                            selectedButtonStyle={{backgroundColor: AppColors.blue}}
                            selectedTextStyle={{color: AppColors.white, fontWeight: Platform.OS === 'ios' ? '600' : '500'}}
                        />
                        <PressableIcon
                            iconName="ios-arrow-dropright-outline"
                            size={25}
                            onPressFunction={this.getPhoneContacts}
                            name="Import Phone Contacts"
                            buttonContainerStyle={{flex: 1, flexDirection: 'row'}}
                            buttonStyle={contactStyle.listButton}
                            textStyle={{alignSelf: 'center', paddingLeft: 7, fontSize: 17, flex: 6, color: AppColors.grey}}
                            color={AppColors.grey}
                            iconStyle={{alignSelf: 'center', flex: 1, alignItems: 'center'}}
                        />
                        <TouchableHighlight style={[contactStyle.button, themeStyles.planFormSaveButton]} onPress={this.onPress} underlayColor='#99d9f4'>
                            <Text style={[contactStyle.buttonText, themeStyles.planFormSaveButtonText]}>Save</Text>
                        </TouchableHighlight>
                    </View>
                    <View style={contactStyle.iconContainer}>
                        <PressableIcon
                            iconName={Icons.media + "-outline"}
                            size={80}
                            onPressFunction={this.captureMedia}
                            buttonStyle={contactStyle.iconButton}
                            color={AppColors.grey}
                        />
                        <PressableIcon
                            iconName={Icons.camera + "-outline"}
                            size={80}
                            onPressFunction={this.takePhoto}
                            buttonStyle={contactStyle.iconButton}
                            color={AppColors.grey}
                        />
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        )
    }
}

const contactStyle = StyleSheet.create({
    buttonText: {
        alignSelf: 'center',
    },
    button: {
        //marginBottom: 10,
        marginTop: 5,
        alignSelf: 'stretch',
        justifyContent: 'center'
    },
    formContainer: {
        marginTop: 20,
        marginHorizontal: 40
    },
    iconButton: {
        alignItems: "center",
        borderRadius: 10,
        paddingRight: 20,
        paddingLeft: 20
    },
    listButton: {
        height: 36,
        borderColor: '#cccccc', // <= relevant style here
        borderWidth: 1,
        borderRadius: 4,
        marginBottom: 15,
        backgroundColor: '#f2f2f2'
    },
    iconContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        height: Dimensions.get('window').height / 4.5
    }
});