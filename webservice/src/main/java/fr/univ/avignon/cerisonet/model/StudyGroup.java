package fr.univ.avignon.cerisonet.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public class StudyGroup extends PanacheEntity {
    public String name;
    public String description;
    public Long createdBy;
    public LocalDateTime createdDate;
    public String meetingTime;
    public String location;
    public String subject;

    @ElementCollection
    public List<Long> members;

    @ElementCollection
    public List<String> tags;

    // Méthode pour rechercher des groupes par un tag
    public static List<StudyGroup> findByTag(String tag) {
        return list("SELECT sg FROM StudyGroup sg JOIN sg.tags t WHERE t = ?1", tag);
    }

    // Méthodes pour rechercher des groupes par matière
    public static List<StudyGroup> findBySubject(String subject) {
        return list("subject", subject);
    }
}
