package fr.univ.avignon.cerisonet;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import fr.univ.avignon.cerisonet.model.StudyGroup;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;


@Path("/api/study-groups")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class StudyGroupResource {

    @GET
    public List<StudyGroup> getAll() {
        return StudyGroup.listAll();
    }

    @GET
    @Path("/{id}")
    public StudyGroup getById(@PathParam("id") Long id) {
        return StudyGroup.findById(id);
    }

    @GET
    @Path("/tag/{tag}")
    public List<StudyGroup> getByTag(@PathParam("tag") String tag) {
        return StudyGroup.findByTag(tag);
    }

    @GET
    @Path("/subject/{subject}")
    public List<StudyGroup> getBySubject(@PathParam("subject") String subject) {
        return StudyGroup.findBySubject(subject);
    }

    @POST
    @Transactional
    public Response create(StudyGroup studyGroup) {
        if (studyGroup.id != null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        studyGroup.createdDate = LocalDateTime.now();
        studyGroup.persist();
        return Response.status(Response.Status.CREATED).entity(studyGroup).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, StudyGroup updatedGroup) {
        StudyGroup existingGroup = StudyGroup.findById(id);

        if (existingGroup == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Mise à jour des champs
        existingGroup.name = updatedGroup.name;
        existingGroup.description = updatedGroup.description;
        existingGroup.meetingTime = updatedGroup.meetingTime;
        existingGroup.location = updatedGroup.location;
        existingGroup.subject = updatedGroup.subject;
        existingGroup.tags = updatedGroup.tags;
        existingGroup.members = updatedGroup.members;

        return Response.ok(existingGroup).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        StudyGroup group = StudyGroup.findById(id);

        if (group == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        group.delete();
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/join/{userId}")
    @Transactional
    public Response joinGroup(@PathParam("id") Long id, @PathParam("userId") Long userId) {
        StudyGroup group = StudyGroup.findById(id);

        if (group == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (!group.members.contains(userId)) {
            group.members.add(userId);
        }

        return Response.ok(group).build();
    }

    @DELETE
    @Path("/{id}/leave/{userId}")
    @Transactional
    public Response leaveGroup(@PathParam("id") Long id, @PathParam("userId") Long userId) {
        StudyGroup group = StudyGroup.findById(id);

        if (group == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        group.members.remove(userId);
        return Response.ok(group).build();
    }

    // Service supplémentaire: analyser les sujets de discussion
    @GET
    @Path("/{id}/analyze-keywords")
    public Response analyzeKeywords(@PathParam("id") Long id) {
        StudyGroup group = StudyGroup.findById(id);

        if (group == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Algorithme simple qui extrait les mots-clés du nom et de la description
        String content = group.name + " " + group.description;
        String[] words = content.toLowerCase().split("\\s+");

        // Filtrer les mots courts et les mots vides
        List<String> keywords = Arrays.stream(words)
                .filter(word -> word.length() > 3)
                .filter(word -> !word.matches("(?i)^(et|ou|pour|dans|avec|les|des|que|qui|est|sont)$"))
                .distinct()
                .collect(Collectors.toList());

        return Response.ok(Map.of("keywords", keywords)).build();
    }

    @OPTIONS
    public Response options() {
        return Response.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "origin, content-type, accept, authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .header("Access-Control-Max-Age", "1209600")
                .build();
    }

    @OPTIONS
    @Path("/{id}")
    public Response optionsById() {
        return options();
    }

    @OPTIONS
    @Path("/tag/{tag}")
    public Response optionsByTag() {
        return options();
    }

    @OPTIONS
    @Path("/subject/{subject}")
    public Response optionsBySubject() {
        return options();
    }

    @OPTIONS
    @Path("/{id}/join/{userId}")
    public Response optionsJoin() {
        return options();
    }

    @OPTIONS
    @Path("/{id}/leave/{userId}")
    public Response optionsLeave() {
        return options();
    }

    @OPTIONS
    @Path("/{id}/analyze-keywords")
    public Response optionsAnalyzeKeywords() {
        return options();
    }
}