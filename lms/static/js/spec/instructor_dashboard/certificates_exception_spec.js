/*global define, sinon */
define([
        'jquery',
        'common/js/spec_helpers/ajax_helpers',
        'js/certificates/models/certificate_exception',
        'js/certificates/views/certificate_whitelist',
        'js/certificates/views/certificate_whitelist_editor',
        'js/certificates/collections/certificate_whitelist'
    ],
    function($, AjaxHelpers, CertificateExceptionModel, CertificateWhiteListView, CertificateWhiteListEditorView,
             CertificateWhiteListCollection) {
        'use strict';
        
        describe("edx.certificates.models.certificates_exception.CertificateExceptionModel", function() {
            var certificate_exception = null;

            var assertValid = function(fields, isValid, expectedErrors) {
                certificate_exception.set(fields);
                var errors = certificate_exception.validate(certificate_exception.attributes);

                if (isValid) {
                    expect(errors).toBe(undefined);
                } else {
                    expect(errors).toEqual(expectedErrors);
                }
            };

            var EXPECTED_ERRORS = {
                user_name_or_email_required: "Student username/email is required."
            };

            beforeEach(function() {

                certificate_exception = new CertificateExceptionModel({user_name: 'test_user'});
                certificate_exception.set({
                    notes: "Test notes"
                });
            });

            it("accepts valid email addresses", function() {
                assertValid({user_email: "bob@example.com"}, true);
                assertValid({user_email: "bob+smith@example.com"}, true);
                assertValid({user_email: "bob+smith@example.com"}, true);
                assertValid({user_email: "bob+smith@example.com"}, true);
                assertValid({user_email: "bob@test.example.com"}, true);
                assertValid({user_email: "bob@test-example.com"}, true);
            });

            it("displays username or email required error", function() {
                assertValid({user_name: ""}, false, EXPECTED_ERRORS.user_name_or_email_required);
            });

        });

        describe("edx.certificates.collections.certificate_whitelist.CertificateWhiteList", function() {
            var certificate_white_list = null,
                certificate_exception_url = 'test/url/';

            var certificates_exceptions_json = [
                {
                    id: "1",
                    user_id: "1",
                    user_name: "test1",
                    user_email: "test1@test.com",
                    course_id: "edX/test/course",
                    created: "Thursday, October 29, 2015",
                    notes: "test notes for test certificate exception"
                },
                {
                    id: "2",
                    user_id : "2",
                    user_name: "test2",
                    user_email : "test2@test.com",
                    course_id: "edX/test/course",
                    created: "Thursday, October 29, 2015",
                    notes: "test notes for test certificate exception"
                }
            ];

            beforeEach(function() {
                certificate_white_list = new CertificateWhiteListCollection(certificates_exceptions_json, {
                    parse: true,
                    canBeEmpty: true,
                    url: certificate_exception_url
                });
            });

            it("has 2 models in the collection after initialization", function() {
                expect(certificate_white_list.models.length).toEqual(2);
            });

            it("returns correct model on getModel call and 'undefined' if queried model is not present", function() {
                expect(certificate_white_list.getModel({user_name: 'test1'})).not.toBe(undefined);
                expect(certificate_white_list.getModel({user_name: 'test_invalid_user'})).toBe(undefined);

                expect(certificate_white_list.getModel({user_email: 'test1@test.com'})).not.toBe(undefined);
                expect(certificate_white_list.getModel({user_email: 'test_invalid_user@test.com'})).toBe(undefined);

                expect(certificate_white_list.getModel({user_name: 'test1'}).attributes).toEqual(
                    {
                        id: '1', user_id: '1', user_name: 'test1', user_email: 'test1@test.com',
                        course_id: 'edX/test/course', created: "Thursday, October 29, 2015",
                        notes: 'test notes for test certificate exception'
                    }
                );

                expect(certificate_white_list.getModel({user_email: 'test2@test.com'}).attributes).toEqual(
                    {
                        id: '2', user_id: '2', user_name: 'test2', user_email: 'test2@test.com',
                        course_id: 'edX/test/course', created: "Thursday, October 29, 2015",
                        notes: 'test notes for test certificate exception'
                    }
                );

            });

            it('sends empty certificate exceptions list if no model is added', function(){
                var successCallback = sinon.spy(),
                    errorCallback = sinon.spy(),
                    requests = AjaxHelpers.requests(this),
                    add_students = 'all';

                var expected = {
                    url: certificate_exception_url + add_students,
                    postData : []
                };

                certificate_white_list.sync({success: successCallback, error: errorCallback}, add_students);
                AjaxHelpers.expectJsonRequest(requests, 'POST', expected.url, expected.postData);
            });

            it('syncs only newly added models with the server', function(){
                var successCallback = sinon.spy(),
                    errorCallback = sinon.spy(),
                    requests = AjaxHelpers.requests(this),
                    add_students = 'new';

                certificate_white_list.add({user_name: 'test3', notes: 'test3 notes'});
                certificate_white_list.sync({success: successCallback, error: errorCallback}, add_students);

                var expected = {
                    url: certificate_exception_url + add_students,
                    postData : [
                        {user_id: "",
                         user_name: "test3",
                         user_email: "",
                         created: "",
                         notes: "test3 notes"}
                        ]
                };

                AjaxHelpers.expectJsonRequest(requests, 'POST', expected.url, expected.postData);
            });
        });

        describe("edx.certificates.views.certificate_whitelist.CertificateWhiteListView", function() {
            var view = null,
                certificate_exception_url = 'test/url/';

            var certificates_exceptions_json = [
                {
                    id: "1",
                    user_id: "1",
                    user_name: "test1",
                    user_email: "test1@test.com",
                    course_id: "edX/test/course",
                    created: "Thursday, October 29, 2015",
                    notes: "test notes for test certificate exception"
                },
                {
                    id: "2",
                    user_id : "2",
                    user_name: "test2",
                    user_email : "test2@test.com",
                    course_id: "edX/test/course",
                    created: "Thursday, October 29, 2015",
                    notes: "test notes for test certificate exception"
                }
            ];

            beforeEach(function() {
                setFixtures();

                var fixture =
                    readFixtures("templates/instructor/instructor_dashboard_2/certificate-white-list.underscore");
                setFixtures("<script type='text/template' id='certificate-white-list-tpl'>" + fixture + "</script>" +
                    "<div class='white-listed-students' id='white-listed-students'></div>");

                var certificate_white_list = new CertificateWhiteListCollection(certificates_exceptions_json, {
                    parse: true,
                    canBeEmpty: true,
                    url: certificate_exception_url
                });


                view = new CertificateWhiteListView({collection: certificate_white_list});
                view.render();

            });

            it("verifies view is initialized and rendered successfully", function() {
                expect(view).not.toBe(undefined);
                expect(view.$el.find('table tbody tr').length).toBe(2);
            });

            it("verifies view is rendered on add/update to collection", function() {
                var user = 'test1',
                    notes = 'test1 notes updates',
                    email='update_email@test.com';

                // Add another model in collection and verify it is rendered
                view.collection.add({user_name: 'test3', notes: 'test3 notes'});
                expect(view.$el.find('table tbody tr').length).toBe(3);

                // Update a model in collection and verify it is rendered
                view.collection.update([
                    {user_name: user, notes: notes, user_email: email}
                ]);

                expect(view.$el.find('table tbody tr td:contains("' + user + '")').parent().html()).
                    toMatch(notes);
                expect(view.$el.find('table tbody tr td:contains("' + user + '")').parent().html()).
                    toMatch(email);
            });

            it('verifies collection sync is called when "Generate Exception Certificates" is clicked', function(){
                var successCallback = sinon.spy(),
                    errorCallback = sinon.spy();

                sinon.stub(view, "showSuccess").returns(successCallback);
                sinon.stub(view, "showError").returns(errorCallback);
                sinon.stub(view.collection, "sync");

                view.$el.find("#generate-exception-certificates").click();

                expect(view.collection.sync.called).toBe(true);
                expect(view.collection.sync.calledWith({success: successCallback, error: errorCallback})).
                    toBe(true);
            });

            it('verifies sync is called with "new/all" argument depending upon selected radio button', function(){
                var successCallback = sinon.spy(),
                    errorCallback = sinon.spy();

                sinon.stub(view, "showSuccess").returns(successCallback);
                sinon.stub(view, "showError").returns(errorCallback);
                sinon.stub(view.collection, "sync");

                view.$el.find("#generate-exception-certificates").click();

                // By default 'Generate a Certificate for all New additions to the Exception list ' is selected
                expect(view.collection.sync.calledWith({success: successCallback, error: errorCallback}), 'new').
                    toBe(true);

                // Select 'Generate a Certificate for all users on the Exception list ' option
                view.$el.find("input:radio[name=generate-exception-certificates-radio][value=all]").click();
                view.$el.find("#generate-exception-certificates").click();
                expect(view.collection.sync.calledWith({success: successCallback, error: errorCallback}), 'all').
                    toBe(true);

            });

        });

        describe("edx.certificates.views.certificate_whitelist_editor.CertificateWhiteListEditorView", function() {
            var view = null,
                certificate_exception_url = 'test/url/';

            var certificates_exceptions_json = [
                {
                    id: "1",
                    user_id: "1",
                    user_name: "test1",
                    user_email: "test1@test.com",
                    course_id: "edX/test/course",
                    created: "Thursday, October 29, 2015",
                    notes: "test notes for test certificate exception"
                },
                {
                    id: "2",
                    user_id : "2",
                    user_name: "test2",
                    user_email : "test2@test.com",
                    course_id: "edX/test/course",
                    created: "Thursday, October 29, 2015",
                    notes: "test notes for test certificate exception"
                }
            ];

            beforeEach(function() {
                setFixtures();

                var fixture = readFixtures(
                    "templates/instructor/instructor_dashboard_2/certificate-white-list-editor.underscore"
                );

                setFixtures(
                    "<script type='text/template' id='certificate-white-list-editor-tpl'>" + fixture + "</script>" +
                    "<div id='certificate-white-list-editor'></div>"
                );

                var certificate_white_list = new CertificateWhiteListCollection(certificates_exceptions_json, {
                    parse: true,
                    canBeEmpty: true,
                    url: certificate_exception_url
                });


                view = new CertificateWhiteListEditorView({collection: certificate_white_list});
                view.render();
            });

            it("verifies view is initialized and rendered successfully", function() {
                expect(view).not.toBe(undefined);
                expect(view.$el.find('#certificate-exception').length).toBe(1);
                expect(view.$el.find('#notes').length).toBe(1);
                expect(view.$el.find('#add-exception').length).toBe(1);
            });

            it("verifies success and error messages", function() {
                var message_selector='.message',
                    error_class = 'msg-error',
                    success_class = 'msg-success',
                    success_message = 'Student Added to exception list';

                var error_messages = {
                    empty_user_name_email: 'Student username/email is required.',
                    duplicate_user: 'username/email already in exception list'
                };

                // click 'Add Exception' button with empty username/email field
                view.$el.find('#add-exception').click();

                // Verify error message for missing username/email
                expect(view.$el.find(message_selector)).toHaveClass(error_class);
                expect(view.$el.find(message_selector).html()).toMatch(error_messages.empty_user_name_email);

                // Add a new Exception to list
                view.$el.find('#certificate-exception').val("test_user");
                view.$el.find('#notes').val("test user notes");
                view.$el.find('#add-exception').click();

                // Verify success message
                expect(view.$el.find(message_selector)).toHaveClass(success_class);
                expect(view.$el.find(message_selector).html()).toMatch(success_message);

                // Add a duplicate Certificate Exception
                view.$el.find('#certificate-exception').val("test_user");
                view.$el.find('#notes').val("test user notes");
                view.$el.find('#add-exception').click();

                // Verify success message
                expect(view.$el.find(message_selector)).toHaveClass(error_class);
                expect(view.$el.find(message_selector).html()).toMatch(error_messages.duplicate_user);
            });

        });


    }
);
