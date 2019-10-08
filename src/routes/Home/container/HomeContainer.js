import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Row, Col, Panel,Grid} from 'react-bootstrap';

class HomeContainer extends Component {
  constructor() {
      super();


   }
   render() {
      return (


        <Grid className="">
          <Row className="">
            <Col xs={12} md={12} className="">

              </Col>
              <Col xs={3} md={3} >
                Test Page
               </Col>
                <Col xs={9} md={9} >

                 </Col>
          </Row>
        </Grid>

      );
   }
}

export default HomeContainer;
