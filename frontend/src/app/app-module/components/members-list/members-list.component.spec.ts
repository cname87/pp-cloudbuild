/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Location, APP_BASE_HREF } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SpyLocation } from '@angular/common/testing';
import { ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { ActivatedRoute } from '@angular/router';

import { AppModule } from '../../app.module';
import { MembersListComponent } from './members-list.component';
import { MembersService } from '../../common/members-service/members.service';
import {
  findAllCssOrNot,
  findCssOrNot,
  asyncData,
  click,
  asyncError,
  ActivatedRouteStub,
} from '../../test-helpers';
import {
  IMember,
  IMemberWithoutId,
} from '../../data-providers/members.data-provider';
import { members } from '../../mocks/mock-members';
import { AppRoutingModule } from '../../../router-module/app.routing.module';

/* spy interfaces */
interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
  addMember: jasmine.Spy;
  deleteMember: jasmine.Spy;
}
interface IErrorHandlerSpy {
  handleError: jasmine.Spy;
}

describe('MembersListComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    /* stub ActivatedRoute with a configurable path parameter */
    const activatedRouteStub = new ActivatedRouteStub();
    /* create spies on memberService methods */
    const membersServiceSpy = jasmine.createSpyObj('membersService', [
      'getMembers',
      'addMember',
      'deleteMember',
    ]);
    const errorHandlerSpy = jasmine.createSpyObj('errorHandler', [
      'handleError',
    ]);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: MembersService, useValue: membersServiceSpy },
        { provide: ErrorHandler, useValue: errorHandlerSpy },
        { provide: NGXLogger, useValue: loggerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    })
      .overrideModule(AppModule, {
        remove: {
          /* removing router module as test below where you click to go to /detail/13 won't work otherwise. */
          imports: [AppRoutingModule],
        },
        add: {
          /* adding RouterTestingModule test below where you click to go to /detail/13 won't work otherwise. */
          imports: [
            RouterTestingModule.withRoutes([
              { path: '**', component: MembersListComponent },
            ]),
          ],
        },
      })
      .compileComponents();
  }

  /* get key DOM elements */
  class Page {
    get linksArray() {
      return findAllCssOrNot<HTMLAnchorElement>(this.fixture, 'a');
    }

    get memberIdArray() {
      return findAllCssOrNot<HTMLAnchorElement>(this.fixture, '#memberId');
    }

    get deleteBtnArray() {
      return findAllCssOrNot<HTMLButtonElement>(this.fixture, '#deleteBtn');
    }

    get memberInput() {
      return findCssOrNot<HTMLInputElement>(this.fixture, 'app-member-input');
    }

    constructor(readonly fixture: ComponentFixture<MembersListComponent>) {}
  }

  function createSpies(
    memberServiceSpy: IMembersServiceSpy,
    membersArray: IMember[],
    errorHandlerSpy: IErrorHandlerSpy,
    isError = false,
  ) {
    const getMembersSpy = memberServiceSpy.getMembers.and.callFake(
      /* returns the mock members array unless an input flag parameter is set in which case an error is thrown. */
      () =>
        isError ? asyncError(new Error('Test Error')) : asyncData(membersArray),
    );
    const addMemberSpy = memberServiceSpy.addMember.and.callFake(
      (member: IMemberWithoutId) => {
        /* return added member as expected */
        const newMember = { id: 21, name: member.name };
        return asyncData(newMember);
      },
    );
    const deleteMemberSpy = memberServiceSpy.deleteMember.and.callFake(
      (id: number) => {
        membersArray = membersArray.filter((m) => m.id !== id);
        /* return nothing as expected */
        return asyncData(null);
      },
    );
    const handleErrorSpy = errorHandlerSpy.handleError.and.stub();

    return {
      getMembersSpy,
      addMemberSpy,
      deleteMemberSpy,
      handleErrorSpy,
    };
  }

  function createExpected() {
    return {
      /* member used for tests */
      memberIndex: 2,
      /* anchor corresponding to memberIndex i.e. member[2] is the 3rd member and there are two links per member => anchor[5] */
      anchorIndex: 5,
      /* create members array from imported mock members array */
      membersArray: JSON.parse(JSON.stringify(members)),
      /* number of links per member */
      numLinksPerMember: 2,
    };
  }

  /* create the component, and get test variables */
  /* isError is passed to create a getMembersSpy that returns an error */
  function createComponent(isError = false) {
    /* create the fixture */
    const fixture = TestBed.createComponent(MembersListComponent);

    /* get the injected instances */
    const { injector } = fixture.debugElement;
    const spyLocation = injector.get<SpyLocation>(Location as any);
    const membersServiceSpy = injector.get<IMembersServiceSpy>(
      MembersService as any,
    );
    const errorHandlerSpy = fixture.debugElement.injector.get<IErrorHandlerSpy>(
      ErrorHandler as any,
    );
    const activatedRouteStub =
      fixture.debugElement.injector.get<ActivatedRouteStub>(
        ActivatedRoute as any,
      );

    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* get the spies */
    const { getMembersSpy, addMemberSpy, deleteMemberSpy, handleErrorSpy } =
      createSpies(
        membersServiceSpy,
        expected.membersArray,
        errorHandlerSpy,
        isError,
      );

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      getMembersSpy,
      addMemberSpy,
      deleteMemberSpy,
      handleErrorSpy,
      spyLocation,
      activatedRouteStub,
      expected,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup(isError = false) {
    await mainSetup();
    const testVars = createComponent(isError);
    return testVars;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup(isError = false) {
    const testVars = await preSetup(isError);
    /* initiate ngOnInit and view changes etc */
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    return testVars;
  }

  describe('after ngOnInit', () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });

    it('should have the members after ngOnInit called', async () => {
      const { fixture, component, page, expected } = await setup();
      /* initiate ngOnInit and view changes etc */
      fixture.detectChanges();
      await fixture.whenStable();
      const membersLoaded = await component.members$.toPromise();
      expect(membersLoaded.length).toEqual(expected.membersArray.length);

      /* await asyncData call */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.memberIdArray!.length).toEqual(
        expected.membersArray.length,
        'members retrieved',
      );
    });

    it('should call getMembers()', async () => {
      const { component, fixture, getMembersSpy, expected } = await setup();
      /* getMembersSpy not called on ngOnInit */
      expect(getMembersSpy).toHaveBeenCalledTimes(0);
      /* increase members.length */
      expected.membersArray.push({ id: 21, name: 'test21' });
      /* manually call getMembers() */
      const membersReturned = await component.getMembers().toPromise();
      /* getMembersSpy called */
      const expectedCalls = 1;
      expect(getMembersSpy).toHaveBeenCalledTimes(expectedCalls);
      /* await asyncData call */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(membersReturned).toEqual(
        expected.membersArray,
        'members retrieved',
      );
    });

    it('should call add()', async () => {
      const { component, fixture, addMemberSpy } = await setup();
      /* call add() */
      const testName = 'testName';
      component.add(testName);
      /* await async data return */
      await fixture.whenStable();
      expect(addMemberSpy).toHaveBeenCalledTimes(1);
      expect(addMemberSpy).toHaveBeenCalledWith({
        name: testName,
      });
    });

    it('should trim name before calling addMember', async () => {
      const { component, fixture, addMemberSpy } = await setup();
      /* call add() */
      const testName = '  testName  ';
      component.add(testName);
      /* await async data return */
      await fixture.whenStable();
      expect(addMemberSpy).toHaveBeenCalledTimes(1);
      expect(addMemberSpy).toHaveBeenCalledWith({
        name: testName.trim(),
      });
    });

    it('should not call addMember if no name', async () => {
      const { component, fixture, addMemberSpy } = await setup();
      /* call add() */
      const testName = '';
      component.add(testName);
      /* await async data return */
      await fixture.whenStable();
      expect(addMemberSpy).toHaveBeenCalledTimes(0);
    });

    it('should call delete()', async () => {
      const { component, deleteMemberSpy, expected } = await setup();
      /* call component function */
      const testMember = expected.membersArray[0];
      component.delete(testMember);
      expect(deleteMemberSpy).toHaveBeenCalledTimes(1);
      expect(deleteMemberSpy).toHaveBeenCalledWith(testMember.id);
    });

    it('should test trackBy function returns member.id', async () => {
      const { component, expected } = await setup();
      const result = component.trackByFn(0, expected.membersArray[1]);
      expect(result).toEqual(expected.membersArray[1].id);
    });

    it('should test trackBy function returns null', async () => {
      const { component } = await setup();
      const result = component.trackByFn(0, null as unknown as IMember);
      expect(result).toEqual(null);
    });
  });

  describe('page setup', () => {
    it('should show the right values on start up', async () => {
      const { fixture, page, expected } = await preSetup();
      /* page fields will be null before ngOnInit */
      /* default constructor member shown */
      expect(page.linksArray).toBeNull();
      /* await component ngOnInit - will load members */
      fixture.detectChanges();
      await fixture.whenStable();
      /* get the mode attribute in the member input element */
      const mode = page.memberInput!.attributes.getNamedItem('ng-reflect-mode');
      expect(mode!.value).toBe('add', 'input box is set to add mode');
      /* get the inputText attribute in the member input element */
      const text = page.memberInput!.attributes.getNamedItem(
        'ng-reflect-input-text',
      );
      expect(text!.value).toBe('', "input box value is set to the '' ");
      /* data bind & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      /* test a member link */
      expect(page.linksArray!.length).toEqual(
        expected.membersArray.length * expected.numLinksPerMember,
      );
      expect(page.linksArray![expected.anchorIndex].innerText).toEqual(
        expected.membersArray[expected.memberIndex].name,
      );
      expect(page.memberIdArray![expected.memberIndex].innerText).toEqual(
        expected.membersArray[expected.memberIndex].id.toString(),
      );
      expect(page.deleteBtnArray!.length).toEqual(expected.membersArray.length);
    });
  });

  describe('page', () => {
    it('should respond to input event', async () => {
      const { component, page } = await setup();
      /* stub on the add() method */
      const addSpy = spyOn(component, 'add').and.stub();
      /* get the input element */
      const input = page.memberInput!;
      /* dispatch an 'inputEnter' event to the member input element */
      const inputEvent = new Event('inputEnter');
      input.dispatchEvent(inputEvent);
      /* test that add() was called */
      expect(addSpy).toHaveBeenCalledWith(inputEvent);
    });

    it('should click the delete button', async () => {
      const { fixture, page, deleteMemberSpy, expected } = await setup();
      const startMembersCount = expected.membersArray.length;
      /* get a member to delete */
      const n = 2;
      const button = page.deleteBtnArray![n];
      const id = +page.memberIdArray![n].innerText;
      /* click the delete button on the member */
      click(button);
      /* initiate view changes */
      /* need to run deleteMember then getMembers */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* input field was cleared */
      expect(deleteMemberSpy).toHaveBeenCalledTimes(1);
      expect(deleteMemberSpy).toHaveBeenCalledWith(id);
      /* test a member was deleted */
      const shouldBeEmpty = page.memberIdArray!.filter(
        (m) => +m.innerText === id,
      );
      expect(shouldBeEmpty).toEqual([]);
      expect(page.memberIdArray!.length).toEqual(startMembersCount - 1);
    });

    it('should navigate to "/detail" on click', async () => {
      const { fixture, page, expected, spyLocation } = await setup();
      /* test a member link */
      expect(page.linksArray!.length).toEqual(
        expected.membersArray.length * expected.numLinksPerMember,
      );
      expect(page.linksArray![expected.anchorIndex].innerText).toEqual(
        expected.membersArray[expected.memberIndex].name,
      );
      expect(page.memberIdArray![expected.memberIndex].innerText).toEqual(
        expected.membersArray[expected.memberIndex].id.toString(),
      );
      expect(page.deleteBtnArray!.length).toEqual(expected.membersArray.length);
      fixture.ngZone!.run(() => {
        /* click on the configured member */
        click(
          page.linksArray![expected.memberIndex * expected.numLinksPerMember],
        );
      });
      /* initiate ngOnInit and view changes etc */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      const { id } = expected.membersArray[expected.memberIndex];
      expect(spyLocation.path()).toEqual(
        `/detail/${id}`,
        'after clicking members link',
      );
    });

    it('should handle a getMembers error', async () => {
      const { component, getMembersSpy, handleErrorSpy } = await setup(true);
      /* call getMembers() manually */
      const membersReturned$ = component.getMembers();
      const membersReturned = await membersReturned$.toPromise();
      expect(getMembersSpy).toHaveBeenCalledTimes(1);
      expect(membersReturned).toEqual([]);
      expect(handleErrorSpy).toHaveBeenCalledTimes(1);
      /* test that handleError called with the thrown error */
      expect(handleErrorSpy.calls.argsFor(0)[0].message).toBe('Test Error');
      /* call the returned getMembers() subscribable again */
      await membersReturned$.toPromise();
      /* handleError still only called once */
      expect(handleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
