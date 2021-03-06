import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import { Provider as MessageSourceProvider } from './MessageSourceContext';
import * as MessageSource from './withMessages';
import { propTypes as MessageSourcePropsApi } from './propTypes';
import { MessageSourceApi } from './useMessageSource';

describe('withMessages', () => {
  const translations = {
    'hello.world': 'Hello World',
    'greeting.normal': 'Hi',
    'greeting.named': 'Hello {name}',
  };

  it('correct props are attached to the wrapped component', () => {
    const PropsCaptor = () => null;
    const PropsCaptorHOC = MessageSource.withMessages(PropsCaptor);
    const renderer = TestRenderer.create(<PropsCaptorHOC />);

    const { root } = renderer;

    const captorInstance = root.findByType(PropsCaptor);
    Object.keys(MessageSourcePropsApi).forEach(api => {
      expect(captorInstance.props[api]).toBeDefined();
    });
  });

  it('retrieves the correct translated value with named parameters', () => {
    function Nested(props) {
      const { getMessageWithNamedParams } = props;
      return getMessageWithNamedParams('greeting.named', {
        name: 'John Doe',
      });
    }

    const NestedHOC = MessageSource.withMessages(Nested);

    const renderer = TestRenderer.create(
      <MessageSourceProvider value={translations}>
        <NestedHOC />
      </MessageSourceProvider>,
    );

    const { root } = renderer;
    const nestedComponentInstance = root.findByType(Nested);

    expect(nestedComponentInstance.children[0]).toBe('Hello John Doe');
  });

  it('retrieves the correct translated value without prefix', () => {
    function Nested(props) {
      const { getMessage } = props;
      return getMessage('hello.world');
    }

    const NestedHOC = MessageSource.withMessages(Nested);

    const renderer = TestRenderer.create(
      <MessageSourceProvider value={translations}>
        <NestedHOC />
      </MessageSourceProvider>,
    );

    const { root } = renderer;
    const nestedComponentInstance = root.findByType(Nested);

    expect(nestedComponentInstance.children[0]).toBe('Hello World');
  });

  it('[curried] retrieves the correct translated value without prefix', () => {
    function Nested(props) {
      const { getMessage } = props;
      return getMessage('hello.world');
    }

    const NestedHOC = MessageSource.withMessages()(Nested);

    const renderer = TestRenderer.create(
      <MessageSourceProvider value={translations}>
        <NestedHOC />
      </MessageSourceProvider>,
    );

    const { root } = renderer;
    const nestedComponentInstance = root.findByType(Nested);

    expect(nestedComponentInstance.children[0]).toBe('Hello World');
  });

  it('[curried] retrieves the correct translated value with prefix', () => {
    function Nested(props) {
      const { getMessage } = props;
      return getMessage('world');
    }

    const NestedHOC = MessageSource.withMessages('hello')(Nested);

    const renderer = TestRenderer.create(
      <MessageSourceProvider value={translations}>
        <NestedHOC />
      </MessageSourceProvider>,
    );

    const { root } = renderer;
    const nestedComponentInstance = root.findByType(Nested);

    expect(nestedComponentInstance.children[0]).toBe('Hello World');
  });

  it('[curried] retrieves the correct translated value in mixed mode', () => {
    function Nested(props) {
      const { getMessage } = props; // eslint-disable-line react/prop-types
      return (
        <React.Fragment>
          {getMessage('world')}
          {getMessage('greeting.normal')}
        </React.Fragment>
      );
    }

    const NestedHOC = MessageSource.withMessages('hello')(Nested);

    const renderer = TestRenderer.create(
      <MessageSourceProvider value={translations}>
        <NestedHOC />
      </MessageSourceProvider>,
    );

    const { root } = renderer;
    const nestedComponentInstance = root.findByType(Nested);

    expect(nestedComponentInstance.children[0]).toBe('Hello World');
    expect(nestedComponentInstance.children[1]).toBe('Hi');
  });

  it('supports nested overrides', () => {
    const levelOne = {
      'hello.world': 'Hello World',
    };

    const levelTwo = {
      'hello.world': 'Hallo Welt',
    };

    function Nested(props) {
      const { getMessage } = props;
      return getMessage('hello.world');
    }

    const NestedHOC = MessageSource.withMessages()(Nested);

    const renderer = TestRenderer.create(
      <MessageSourceProvider value={levelOne}>
        <NestedHOC />
        <MessageSourceProvider value={levelTwo}>
          <NestedHOC />
        </MessageSourceProvider>
      </MessageSourceProvider>,
    );

    const components = renderer.root.findAllByType(Nested);
    expect(components).toHaveLength(2);

    const [levelOneComponent, levelTwoComponent] = components;
    expect(levelOneComponent.children[0]).toBe('Hello World');
    expect(levelTwoComponent.children[0]).toBe('Hallo Welt');
  });

  it('supports ref forwarding', () => {
    const NestedHOC = MessageSource.withMessages('hello')(
      class Nested extends React.Component<MessageSourceApi> {
        myMethod = () => {
          return 100;
        };

        render() {
          const { getMessageWithNamedParams } = this.props;
          return <>{getMessageWithNamedParams('hello.world', {})}</>;
        }
      },
    );

    // eslint-disable-next-line react/no-multi-comp
    class MyFwRefComponent extends React.Component {
      nestedRef = React.createRef();

      render() {
        return <NestedHOC ref={this.nestedRef} />;
      }
    }

    const renderer = TestRenderer.create(
      <MessageSourceProvider value={translations}>
        <MyFwRefComponent />
      </MessageSourceProvider>,
    );

    const { root } = renderer;
    const fwRefCompInstance = root.findByType(MyFwRefComponent);

    expect(fwRefCompInstance.instance).toBeDefined();
    expect(fwRefCompInstance.instance.nestedRef.current).toBeDefined();
    expect(fwRefCompInstance.instance.nestedRef.current.myMethod).toBeDefined();
    expect(fwRefCompInstance.instance.nestedRef.current.myMethod()).toBe(100);
  });
});
