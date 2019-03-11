'use strict';
import React, { Component } from 'react';
import { StyleSheet, NativeEventEmitter, DeviceEventEmitter, AsyncStorage, PermissionsAndroid } from 'react-native';
import ReactNativeHeading from '@zsajjad/react-native-heading';
import Geolocation from 'react-native-geolocation-service'
import {
  ViroARScene,
  ViroText,
  ViroConstants,
} from 'react-viro';
import RNSimpleCompass from 'react-native-simple-compass';

const degree_update_rate = 3; // Number of degrees changed before the callback is triggered

export default class SceneAR extends Component {
  async requestLocationPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          'title': 'UnalAR',
          'message': 'UnalAR requiere tu localización'
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //console.log("You can use the location")
        //alert("You can use the location");
        Geolocation.getCurrentPosition((Degree = this.state.Degree) => { //change to position if degree doesnt work
          this.setState({
            latitude: Degree.coords.latitude,
            longitude: Degree.coords.longitude,
            error: null,
            string: String(Degree.coords.latitude)
          });
        }, (error) => this.setState({ error: error.message }),
          { enableHighAccuracy: true }
        )
      } else {
        //console.log("location permission denied")
        alert("No se puede usar la localización");
      }
      return granted;
    } catch (err) {
      console.warn(err)
    }
  }
  constructor() {
    super();
    this.requestLocationPermission = this.requestLocationPermission.bind(this);
    // Set initial state here
    this.state = {
      text: "Inicializando...",
      latitude: 0,
      longitude: 0,
      cytX: 0,
      cytZ: 0,
      quimicaX: 0,
      quimicaZ: 0,
      aulasX: 0,
      aulasZ: 0,
      headingAngle: 0,
      headAngle: 0
    };
    RNSimpleCompass.start(degree_update_rate, (degree) => {
      this.setState({ Degree: degree });
      RNSimpleCompass.stop();
    });
    // bind 'this' to functions   
    this._onInitialized = this._onInitialized.bind(this);
    this._latLongToMerc = this._latLongToMerc.bind(this);
    this._transformPointToAR = this._transformPointToAR.bind(this);
  }
  updateHead() {
    AsyncStorage.setItem('headstart', JSON.stringify(this.state.headingAngle))
  }
  componentDidMount() {
    this.requestLocationPermission();
    ReactNativeHeading.start(1)
      .then(didStart => {
        this.setState({
          headingIsSupported: didStart,
        })
      })
    var flag = 0
    DeviceEventEmitter.addListener('headingUpdated', heading => {
      this.setState({ headingAngle: heading })
      //console.log('heading State',heading)
      if (flag == 0) {
        this.updateHead()
      }
      flag = 1
    });
    this.updateHead()
  }
  componentWillUnmount() {
    ReactNativeHeading.stop();
    DeviceEventEmitter.removeAllListeners('headingUpdated');
  }
  render() {
    return (<ViroARScene onTrackingUpdated={this._onInitialized}>
      <ViroText text="CyT" scale={[4, 4, 4]} transformBehaviors={["billboard"]} position={[this.state.cytX, 0, this.state.cytZ]} style={styles.helloWorldTextStyle} />
      <ViroText text="Química" scale={[4, 4, 4]} transformBehaviors={["billboard"]} position={[this.state.quimicaX, 0, this.state.quimicaZ]} style={styles.helloWorldTextStyle} />
      <ViroText text="Aulas" scale={[4, 4, 4]} transformBehaviors={["billboard"]} position={[this.state.aulasX, 0, this.state.aulasZ]} style={styles.helloWorldTextStyle} />
    </ViroARScene>);
  }
  _onInitialized() {
    var cyt = this._transformPointToAR(4.6381390, -74.0845033);
    var qumica = this._transformPointToAR(4.6376711, -74.0836540);
    var aulas = this._transformPointToAR(4.6385059, -74.0835930);
    this.setState({
      cytX: cyt.x,
      cytZ: cyt.z,
      quimicaX: qumica.x,
      quimicaZ: qumica.z,
      aulasX: aulas.x,
      aulasZ: aulas.z,
      text: "AR Init called."
    });
  }
  _latLongToMerc(lat_deg, lon_deg) {
    var lon_rad = (lon_deg / 180.0 * Math.PI)
    var lat_rad = (lat_deg / 180.0 * Math.PI)
    var sm_a = 637813.70
    var xmeters = sm_a * lon_rad
    var ymeters = sm_a * Math.log((Math.sin(lat_rad) + 1) / Math.cos(lat_rad))
    return ({ x: xmeters, y: ymeters });
  }
  _transformPointToAR(lat, long) {
    AsyncStorage.getItem('headstart')
      .then(res => { console.log('HeadAngle', res), this.setState({ headAngle: res }) })
    var objPoint = this._latLongToMerc(lat, long);
    var devicePoint = this._latLongToMerc(this.state.latitude, this.state.longitude);
    var objFinalPosZ = (objPoint.y - devicePoint.y);
    var objFinalPosX = (objPoint.x - devicePoint.x);

    return ({ x: objFinalPosX, z: -objFinalPosZ });
  }
}
var styles = StyleSheet.create({
  helloWorldTextStyle: {
    fontFamily: 'Arial',
    fontSize: 30,
    color: '#d30606',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});

module.exports = SceneAR; 