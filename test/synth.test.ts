import * as util from 'util';
import * as cdk from '@aws-cdk/core';
import { ServerlessPeriodicTimer } from '../src';

test('synthesizes correctly', () => {

  const mockApp = new cdk.App();
  const stack = new cdk.Stack(mockApp, 'testing-stack');

  
  new ServerlessPeriodicTimer(stack, 'testPeriodicTimer');

  const mockCloudAssembly = mockApp.synth({ force: true });

  const stackArtifact = mockCloudAssembly.getStackArtifact(stack.artifactId);

  console.log(util.inspect(mockCloudAssembly.tree(), false, 8));

  const outputNames = Object.keys(stackArtifact.manifest.metadata || []).map(el => {
    //console.log(util.inspect(el));
    return el;
  });
  console.log(util.inspect(outputNames));

});
