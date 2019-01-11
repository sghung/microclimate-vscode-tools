#!/usr/bin/env bash

# To be run from the repository root directory
# $artifact_name must be set and the file it points to must be in the working directory

# If requesting a custom build in the Travis UI, set:
: '
env:
    - rc=true
'
# to do an RC build

if [[ "$rc" != "true" && "$TRAVIS_EVENT_TYPE" != "cron" ]]; then
    echo "$(basename $0): not a release or cronjob, skipping deploy"
    exit 0
fi

if [[ "$rc" == "true" ]]; then
    tag="_rc-$(date +'%F-%H%M')"
    deploy_dir="release"
else
    tag="_nightly-$(date +'%F-%H%M')"
    deploy_dir="nightly"
fi

echo "Build tag is $tag"

# Will resolve to something like "microclimate-tools-18.12.0_nightly-2018-12-07-2330.vsix"
tagged_artifact_name="${artifact_name/.vsix/$tag.vsix}"
mv -v "$artifact_name" "$tagged_artifact_name"

# Update the last_build file linking to the most recent vsix
build_info_file="last_build.html"
#build_date="$(date +'%F_%H-%M_%Z')"
commit_info="$(git log $TRAVIS_BRANCH -3 --pretty='%h by %an - %s<br>')"
# This link is only really useful on DHE
artifact_link="<a href=\"./$tagged_artifact_name\">$tagged_artifact_name</a>"
printf "Last build: $artifact_link<br><br><b>Latest commits on $TRAVIS_BRANCH:</b><br>$commit_info" > "$build_info_file"

artifactory_path="${artifactory_path}${deploy_dir}"
artifactory_full_url="${artifactory_url}/${artifactory_path}"
echo "artifactory_full_url is $artifactory_full_url"

artifactory_cred_header="X-JFrog-Art-Api: $artifactory_apikey"

artf_resp=$(curl -X PUT -sS -H "$artifactory_cred_header" -T "$tagged_artifact_name" "$artifactory_full_url/$tagged_artifact_name")
echo "$artf_resp"

if [[ "$artf_resp" != *"created"* ]]; then
    >&2 echo "Artifactory deploy failed!"
    exit 1
fi

curl -X PUT -sS  -H "$artifactory_cred_header" -T "$build_info_file" "$artifactory_full_url/$build_info_file"