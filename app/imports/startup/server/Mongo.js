import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { Projects } from '../../api/projects/Projects';
import { ProjectsInterests } from '../../api/projects/ProjectsInterests';
import { Profiles } from '../../api/profiles/Profiles';
// import { ProfilesProjects } from '../../api/profiles/ProfilesProjects';
import { ProfilesInterests } from '../../api/profiles/ProfilesInterests';
import { Interests } from '../../api/interests/Interests';
import { VendorTypes } from '../../api/vendor/VendorTypes';
import { VendorClass } from '../../api/interests/vendorClassifications';
import { Vendors } from '../../api/vendor/Vendors';
import { VendorMenus } from '../../api/vendor/VendorMenus';

/* eslint-disable no-console */

/** Define a user in the Meteor accounts package. This enables login. Username is the email address. */
function createUser(email, role) {
  console.log(` Creating user ${email}.`);
  const userID = Accounts.createUser({ username: email, email, password: 'foo' });
  if (role === 'admin') {
    Roles.createRole(role, { unlessExists: true });
    Roles.addUsersToRoles(userID, 'admin');
    console.log(`${email} role: admin`);
  }

  if (role === 'vendor') {
    Roles.createRole(role, { unlessExists: true });
    Roles.addUsersToRoles(userID, 'vendor');
    console.log(`${email} role: vendor`);
  }

}

/** Define an interest.  Has no effect if interest already exists. */
function addInterest(interest) {
  Interests.collection.update({ name: interest }, { $set: { name: interest } }, { upsert: true });
}

/** Define a Vendor Type.  Has no effect if interest already exists. */
function addVendorType(vendorType) {
  VendorClass.collection.update({ vendor: vendorType }, { $set: { vendor: vendorType } }, { upsert: true });
}

/** Defines a new user and associated profile. Error if user already exists. */
function addProfile({ firstName, lastName, bio, title, interests /** projects */, picture, email, role }) {
  console.log(`Defining profile ${email}`);
  // Define the user in the Meteor accounts package.
  createUser(email, role);
  // Create the profile.
  Profiles.collection.insert({ firstName, lastName, bio, title, picture, email });
  // Add interests and projects.
  interests.map(interest => ProfilesInterests.collection.insert({ profile: email, interest }));
  // projects.map(project => ProfilesProjects.collection.insert({ profile: email, project }));
  // Make sure interests are defined in the Interests collection if they weren't already.
  interests.map(interest => addInterest(interest));
}

/** Defines a new vendor and associated vendor. Error if user already exists. */
function addVendor({ vendorName, campusLocation, vendorHours, description, vendorTypes, picture, email, role }) {
  console.log(`Defining profile ${email}`);
  // Define the user in the Meteor accounts package.
  createUser(email, role);
  // Create the profile.
  Vendors.collection.insert({ vendorName, campusLocation, vendorHours, description, picture, email });
  // Add interests and projects.
  vendorTypes.map(vendorType => VendorTypes.collection.insert({ vendor: email, vendorType }));
  // Make sure interests are defined in the Interests collection if they weren't already.
  vendorTypes.map(vendorType => addVendorType(vendorType));
}

/** Define a new project. Error if project already exists.  */
function addProject({ name, homepage, description, interests, picture }) {
  console.log(`Defining project ${name}`);
  Projects.collection.insert({ name, homepage, description, picture });
  interests.map(interest => ProjectsInterests.collection.insert({ project: name, interest }));
  // Make sure interests are defined in the Interests collection if they weren't already.
  interests.map(interest => addInterest(interest));
}

// /** Initialize DB if it appears to be empty (i.e. no users defined.) */
// if (Meteor.users.find().count() === 0) {
//   if (Meteor.settings.defaultProjects && Meteor.settings.defaultProfiles) {
//     console.log('Creating the default profiles');
//     Meteor.settings.defaultProfiles.map(profile => addProfile(profile));
//     console.log('Creating the default projects');
//     Meteor.settings.defaultProjects.map(project => addProject(project));
//   } else {
//     console.log('Cannot initialize the database!  Please invoke meteor with a settings file.');
//   }
// }

// Initialize the ProfilesCollection if empty.
if (Profiles.collection.find().count() === 0) {
  if (Meteor.settings.defaultProfiles) {
    console.log('Creating default Profiles.');
    Meteor.settings.defaultProfiles.map(profile => addProfile(profile));
  }
}

// Initialize the VendorsCollection if empty.
if (Vendors.collection.find().count() === 0) {
  if (Meteor.settings.defaultVendors) {
    console.log('Creating default Vendors.');
    Meteor.settings.defaultVendors.map(vendor => addVendor(vendor));
  }
}
// Initialize the ProjectsCollection if empty.
if (Projects.collection.find().count() === 0) {
  if (Meteor.settings.defaultProjects) {
    console.log('Creating default Projects.');
    Meteor.settings.defaultProjects.map(project => addProject(project));
  }
}

// Initialize the VendorMenusCollection if empty.
if (VendorMenus.collection.find().count() === 0) {
  if (Meteor.settings.defaultVendorMenus) {
    console.log('Creating default vendor menus.');
    // Create the profile.
    Meteor.settings.defaultVendorMenus.map(vendorMenu => VendorMenus.collection.insert(vendorMenu));
  }
}

/**
 * If the loadAssetsFile field in settings.development.json is true, then load the data in private/data.json.
 * This approach allows you to initialize your system with large amounts of data.
 * Note that settings.development.json is limited to 64,000 characters.
 * We use the "Assets" capability in Meteor.
 * For more info on assets, see https://docs.meteor.com/api/assets.html
 * User count check is to make sure we don't load the file twice, which would generate errors due to duplicate info.
 */
if ((Meteor.settings.loadAssetsFile) && (Meteor.users.find().count() < 7)) {
  const assetsFileName = 'data.json';
  console.log(`Loading data from private/${assetsFileName}`);
  const jsonData = JSON.parse(Assets.getText(assetsFileName));
  jsonData.profiles.map(profile => addProfile(profile));
  jsonData.vendors.map(vendor => addVendor(vendor));
  jsonData.projects.map(project => addProject(project));
}
